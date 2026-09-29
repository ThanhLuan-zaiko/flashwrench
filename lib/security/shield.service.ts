import { FixedWindowCounter } from "./fixed-window";
import { overloadConfig, shieldRules } from "./security.constants";
import type { ShieldVerdict, TrafficClass } from "./security.types";
import { readShieldBan, writeShieldBan } from "./shield-ban.repository";
import { classifyTraffic, declaredBodyTooLarge, isUploadPath } from "./traffic";

export type ShieldInput = {
  ip: string;
  pathname: string;
  method: string;
  contentLength: string | null;
};

export type ShieldDeps = {
  now: () => number;
  readBan: (ip: string) => Promise<number | null>;
  writeBan: (
    ip: string,
    untilEpochMs: number,
    banSeconds: number,
  ) => Promise<void>;
};

const MAX_BANNED_KEYS = 50_000;

export function createShieldEvaluator(
  deps: Partial<ShieldDeps> = {},
): (input: ShieldInput) => Promise<ShieldVerdict> {
  const now = deps.now ?? (() => Date.now());
  const readBan = deps.readBan ?? readShieldBan;
  const writeBan = deps.writeBan ?? writeShieldBan;

  const rules = shieldRules();
  const overload = overloadConfig();
  const ipWindows = new FixedWindowCounter(now);
  const strikes = new FixedWindowCounter(now);
  const globalGate = new FixedWindowCounter(now);
  // Local mirror of the ban list: only populated on strike trips, so the
  // hot path never touches ScyllaDB for a lookup.
  const bannedUntil = new Map<string, number>();

  function banRemaining(ip: string): number {
    const until = bannedUntil.get(ip);
    if (until === undefined) return 0;
    const left = until - now();
    if (left <= 0) {
      bannedUntil.delete(ip);
      return 0;
    }
    return Math.ceil(left / 1000);
  }

  function pruneBans(): void {
    if (bannedUntil.size <= MAX_BANNED_KEYS) return;
    const at = now();
    for (const [ip, until] of bannedUntil) {
      if (until <= at) bannedUntil.delete(ip);
    }
  }

  async function escalate(ip: string): Promise<number> {
    // A tripped per-IP window costs one strike; enough strikes inside the
    // strike window promote to a shared ban. ScyllaDB is consulted only on
    // this path — failing open keeps a database outage from widening it.
    const strikeCount = strikes.record(`strike:${ip}`, overload.strikeWindowMs);
    if (strikeCount < overload.banStrikes) return 0;

    const localUntil = now() + overload.banSeconds * 1000;
    try {
      const remote = await readBan(ip);
      const until = Math.max(localUntil, remote ?? 0);
      bannedUntil.set(ip, until);
      pruneBans();
      if (until === localUntil) {
        void writeBan(ip, until, overload.banSeconds).catch((error) =>
          console.error("[shield] failed to publish ban", error),
        );
      }
      return Math.ceil((until - now()) / 1000);
    } catch (error) {
      console.error("[shield] ban lookup failed, applying local ban", error);
      bannedUntil.set(ip, localUntil);
      pruneBans();
      return overload.banSeconds;
    }
  }

  return async function evaluate(input: ShieldInput): Promise<ShieldVerdict> {
    const trafficClass = classifyTraffic(input.pathname, input.method);
    if (trafficClass === "asset") return { action: "pass" };

    const banned = banRemaining(input.ip);
    if (banned > 0) {
      return {
        action: "reject",
        status: 429,
        retryAfterSec: banned,
        reason: "banned",
      };
    }

    const isUpload = isUploadPath(input.pathname, input.method);
    const maxBody = isUpload ? overload.maxUploadBytes : overload.maxJsonBytes;
    if (
      input.method !== "GET" &&
      input.method !== "HEAD" &&
      declaredBodyTooLarge(input.contentLength, maxBody)
    ) {
      return {
        action: "reject",
        status: 413,
        retryAfterSec: 0,
        reason: "body_too_large",
      };
    }

    // Herd breaker: one instance-wide bucket per second. Overload sheds
    // excess work immediately instead of queueing it into collapse; the
    // rejection does not count as a strike against the caller.
    const gate = globalGate.hit("global", overload.globalPerSecond, 1000);
    if (!gate.allowed) {
      return {
        action: "reject",
        status: 503,
        retryAfterSec: gate.retryAfterSec,
        reason: "overloaded",
      };
    }

    const rule = rules[trafficClass as Exclude<TrafficClass, "asset">];
    const windowHit = ipWindows.hit(
      `${trafficClass}:${input.ip}`,
      rule.limit,
      rule.windowMs,
    );
    if (windowHit.allowed) return { action: "pass" };

    const bannedFor = await escalate(input.ip);
    if (bannedFor > 0) {
      return {
        action: "reject",
        status: 429,
        retryAfterSec: bannedFor,
        reason: "banned",
      };
    }
    return {
      action: "reject",
      status: 429,
      retryAfterSec: windowHit.retryAfterSec,
      reason: "rate_limited",
    };
  };
}

// Singleton for the proxy: counters must live across requests.
export const evaluateShield = createShieldEvaluator();
