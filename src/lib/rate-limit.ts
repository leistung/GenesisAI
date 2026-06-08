import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
      limiter: Ratelimit.slidingWindow(10, "1 m"),
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
const RATE_LIMIT_MAX = 10;

function checkMemoryRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetTime < windowStart) {
      memoryStore.delete(key);
    }
  }

  let entry = memoryStore.get(ip);
  if (!entry || entry.resetTime < windowStart) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    memoryStore.set(ip, entry);
  }

  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  const reset = Math.ceil(entry.resetTime / 1000);

  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining,
    reset,
  };
}

export async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Try Upstash Redis first
  const limiter = getRatelimit();
  if (limiter) {
    const result = await limiter.limit(ip);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: Math.floor(Date.now() / 1000) + 60,
    };
  }

  // Fallback to in-memory
  return checkMemoryRateLimit(ip);
}
