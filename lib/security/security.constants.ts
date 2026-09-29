import type { RateLimitRule, TrafficClass } from "./security.types";

function intEnv(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

// The shield defaults to ON in production and OFF in development so local
// browsing (where every request shares the "unknown" IP bucket) never locks
// the developer out. SHIELD_ENABLED=true/false overrides either way.
export function isShieldEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const flag = env.SHIELD_ENABLED?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return env.NODE_ENV === "production";
}

// Per-class per-IP fixed windows. Defaults assume the shield runs behind
// Cloudflare, so its job is absorbing what edge filtering lets through.
export function shieldRules(
  env: Record<string, string | undefined> = process.env,
): Record<TrafficClass, RateLimitRule> {
  const windowMs = intEnv(env, "SHIELD_WINDOW_MS", 10_000);
  return {
    auth: {
      limit: intEnv(env, "SHIELD_AUTH_LIMIT", 20),
      windowMs: intEnv(env, "SHIELD_AUTH_WINDOW_MS", 60_000),
    },
    api: { limit: intEnv(env, "SHIELD_API_LIMIT", 120), windowMs },
    media: { limit: intEnv(env, "SHIELD_MEDIA_LIMIT", 600), windowMs },
    page: { limit: intEnv(env, "SHIELD_PAGE_LIMIT", 240), windowMs },
    asset: { limit: Number.MAX_SAFE_INTEGER, windowMs },
  };
}

export type OverloadConfig = {
  // Instance-wide admission cap per rolling second. Overflow is rejected
  // immediately (fail-fast) so admitted traffic keeps its latency budget.
  globalPerSecond: number;
  // Repeat offenders: N tripped windows inside the strike window earn a
  // shared ScyllaDB ban so every instance rejects the IP up front.
  banStrikes: number;
  strikeWindowMs: number;
  banSeconds: number;
  // Reject oversized bodies early, before any route handler reads them.
  maxJsonBytes: number;
  maxUploadBytes: number;
};

export function overloadConfig(
  env: Record<string, string | undefined> = process.env,
): OverloadConfig {
  return {
    globalPerSecond: intEnv(env, "SHIELD_GLOBAL_RPS", 600),
    banStrikes: intEnv(env, "SHIELD_BAN_STRIKES", 3),
    strikeWindowMs: intEnv(env, "SHIELD_STRIKE_WINDOW_MS", 60_000),
    banSeconds: intEnv(env, "SHIELD_BAN_SECONDS", 600),
    maxJsonBytes: intEnv(env, "SHIELD_MAX_JSON_BYTES", 1_048_576),
    maxUploadBytes: intEnv(
      env,
      "SHIELD_MAX_UPLOAD_BYTES",
      intEnv(env, "MEDIA_MAX_MB", 8) * 1_048_576,
    ),
  };
}
