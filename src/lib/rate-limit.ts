import { NextRequest } from "next/server";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  request: NextRequest,
  actionKey: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): { isRateLimited: boolean; remaining: number; resetTimeMs: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = `${actionKey}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const current = rateLimitMap.get(key);

  if (!current || current.resetAt < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { isRateLimited: false, remaining: maxRequests - 1, resetTimeMs: now + windowMs };
  }

  if (current.count >= maxRequests) {
    return { isRateLimited: true, remaining: 0, resetTimeMs: current.resetAt };
  }

  current.count += 1;
  return { isRateLimited: false, remaining: maxRequests - current.count, resetTimeMs: current.resetAt };
}
