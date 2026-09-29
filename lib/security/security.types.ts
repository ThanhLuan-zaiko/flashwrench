// Traffic classes decide which rate-limit rule a request falls under.
// "media" is separate because gallery pages legitimately fan out many
// image GETs per view; "auth" is the strictest bucket on top of the
// per-route guards that already live in lib/auth/guards.ts.
export type TrafficClass = "auth" | "api" | "media" | "page" | "asset";

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type ShieldVerdict =
  | { action: "pass" }
  | {
      action: "reject";
      status: 413 | 429 | 503;
      retryAfterSec: number;
      reason: "body_too_large" | "rate_limited" | "banned" | "overloaded";
    };
