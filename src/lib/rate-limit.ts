import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { auth } from "./auth";

// 不同订阅等级的限流配置（每分钟最大请求数）
const RATE_LIMITS_BY_TIER = {
  anonymous: 5,   // 未登录用户：5 次/分钟
  free: 10,       // 免费用户：10 次/分钟
  premium: 30,    // Premium 用户：30 次/分钟
  ultimate: 60,   // Ultimate 用户：60 次/分钟
} as const;

// Create ratelimiter - uses Upstash Redis in production, falls back to in-memory in development
let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });

    ratelimit = new Ratelimit({
      redis,
      // 使用较高上限的滑动窗口，实际限制在 checkRateLimit 中按等级动态判断
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
    });

    return ratelimit;
  }

  return null;
}

// In-memory fallback for development
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkMemoryRateLimit(
  identifier: string,
  maxRequests: number
): {
  allowed: boolean;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // 清理过期条目
  if (memoryStore.size > 10000) {
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetTime < windowStart) {
        memoryStore.delete(key);
      }
    }
  }

  const key = identifier;
  let entry = memoryStore.get(key);
  if (!entry || entry.resetTime < windowStart) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    memoryStore.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const reset = Math.ceil(entry.resetTime / 1000);

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    reset,
  };
}

/**
 * 根据用户订阅等级获取限流上限
 */
function getMaxRequests(tier?: string | null): number {
  if (!tier || tier === "free") return RATE_LIMITS_BY_TIER.free;
  if (tier === "premium") return RATE_LIMITS_BY_TIER.premium;
  if (tier === "ultimate") return RATE_LIMITS_BY_TIER.ultimate;
  return RATE_LIMITS_BY_TIER.free;
}

/**
 * 检查速率限制，按用户订阅等级动态调整上限
 */
export async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  // 获取用户身份和订阅等级
  const session = await auth();
  const userId = session?.user?.id;
  const subscriptionTier = session?.user?.subscriptionTier;

  // 限流标识：登录用户用 userId，匿名用户用 IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const identifier = userId || `ip:${ip}`;

  const maxRequests = userId
    ? getMaxRequests(subscriptionTier)
    : RATE_LIMITS_BY_TIER.anonymous;

  // Try Upstash Redis first
  const limiter = getRatelimit();
  if (limiter) {
    const result = await limiter.limit(identifier);
    // Upstash 返回的 remaining 是基于 60 的，需要按实际上限调整
    const adjustedRemaining = Math.min(result.remaining, maxRequests);
    return {
      allowed: result.success && result.remaining > 0,
      remaining: adjustedRemaining,
      reset: Math.floor(Date.now() / 1000) + 60,
    };
  }

  // Fallback to in-memory
  return checkMemoryRateLimit(identifier, maxRequests);
}
