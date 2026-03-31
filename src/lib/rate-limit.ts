import { TooManyRequestsError } from "@/lib/api";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMITS = new Map<string, RateLimitEntry>();

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "anonymous";
}

export function assertRateLimit(
  request: Request,
  key: string,
  maxRequests: number,
  windowMs: number,
) {
  const clientKey = `${key}:${getClientKey(request)}`;
  const now = Date.now();
  const current = RATE_LIMITS.get(clientKey);

  if (!current || current.resetAt <= now) {
    RATE_LIMITS.set(clientKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    throw new TooManyRequestsError("Too many requests. Please try again shortly.", {
      retryAfterMs: Math.max(0, current.resetAt - now),
    });
  }

  current.count += 1;
  RATE_LIMITS.set(clientKey, current);
}
