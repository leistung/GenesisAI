import { NextRequest } from "next/server";

// Simple in-memory rate limiter (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per window

export async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }

  let entry = rateLimitStore.get(ip);
  if (!entry || entry.resetTime < windowStart) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitStore.set(ip, entry);
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
