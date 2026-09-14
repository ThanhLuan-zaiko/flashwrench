import { NextResponse } from "next/server";
import { consumeRateLimit } from "./rate-limit.repository";

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 10 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  refresh: { limit: 30, windowMs: 60 * 1000 },
  password: { limit: 10, windowMs: 10 * 60 * 1000 },
} as const;

export const RATE_LIMIT_MESSAGE =
  "Bạn thao tác quá nhanh. Vui lòng chờ giây lát rồi thử lại.";

export function rateLimitBucket(
  kind: keyof typeof RATE_LIMITS,
  ip: string,
  windowMs: number,
): string {
  return `${kind}:${ip}:${Math.floor(Date.now() / windowMs)}`;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Only accept same-origin requests when the browser sends Origin.
// Non-browser clients (mobile apps, curl) send no Origin, so let them pass.
export function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("host") ?? request.headers.get("x-forwarded-host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type GuardKind = keyof typeof RATE_LIMITS;

// Shared guard for state-changing routes: blocks cross-origin CSRF and
// rate-limits attempts in ScyllaDB (shared, TTL-cleaned, no RAM growth).
// Returns an error response, or null to continue.
export async function enforceRequestGuards(
  request: Request,
  kind: GuardKind,
): Promise<NextResponse | null> {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(
      { errors: { form: "Yêu cầu không hợp lệ (sai nguồn gốc)." } },
      { status: 403 },
    );
  }
  const { limit, windowMs } = RATE_LIMITS[kind];
  try {
    const decision = await consumeRateLimit(
      rateLimitBucket(kind, clientIp(request), windowMs),
      limit,
      windowMs,
    );
    if (!decision.allowed) {
      const response = NextResponse.json(
        { errors: { form: RATE_LIMIT_MESSAGE } },
        { status: 429 },
      );
      response.headers.set("Retry-After", String(decision.retryAfterSec));
      return response;
    }
  } catch (error) {
    // Fail open: a rate-limiter outage must not lock every user out.
    console.error("[auth] rate limiter unavailable, allowing request", error);
  }
  return null;
}
