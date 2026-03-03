import { NextRequest, NextResponse } from "next/server";

// ── In-memory sliding window rate limiter ──────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60 seconds
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

// ── Rate limit check ───────────────────────────────

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Window expired or first request — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt };
  }

  // Within window
  entry.count++;
  store.set(key, entry);

  if (entry.count > config.limit) {
    return { success: false, limit: config.limit, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ── Predefined rate limit tiers ────────────────────

export const RATE_LIMITS = {
  /** Auth endpoints: 10 requests per 15 minutes */
  auth: { limit: 10, windowSeconds: 900 },
  /** AI generation: 20 requests per minute */
  ai: { limit: 20, windowSeconds: 60 },
  /** Admin API: 100 requests per minute */
  admin: { limit: 100, windowSeconds: 60 },
  /** Customer API: 60 requests per minute */
  customer: { limit: 60, windowSeconds: 60 },
  /** Public API: 120 requests per minute */
  public: { limit: 120, windowSeconds: 60 },
  /** Webhooks: 30 requests per minute */
  webhook: { limit: 30, windowSeconds: 60 },
} as const;

// ── Helper to apply rate limit in route handlers ───

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return response;
}

// ── Middleware-level rate limit helper ──────────────

export function rateLimitMiddleware(
  request: NextRequest,
  tier: keyof typeof RATE_LIMITS,
): RateLimitResult {
  const ip = getClientIP(request);
  const key = `${tier}:${ip}`;
  return checkRateLimit(key, RATE_LIMITS[tier]);
}
