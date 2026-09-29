import { afterEach, describe, expect, test } from "bun:test";
import {
  createShieldEvaluator,
  type ShieldInput,
} from "@/lib/security/shield.service";

// Repository functions are injected fakes (recorded, never real ScyllaDB).
// Limits come from env at evaluator construction, so each test builds a
// fresh evaluator after pinning the knobs it needs.

const ENV_KEYS = [
  "SHIELD_PAGE_LIMIT",
  "SHIELD_API_LIMIT",
  "SHIELD_MEDIA_LIMIT",
  "SHIELD_AUTH_LIMIT",
  "SHIELD_WINDOW_MS",
  "SHIELD_AUTH_WINDOW_MS",
  "SHIELD_GLOBAL_RPS",
  "SHIELD_BAN_STRIKES",
  "SHIELD_STRIKE_WINDOW_MS",
  "SHIELD_BAN_SECONDS",
  "SHIELD_MAX_JSON_BYTES",
  "SHIELD_MAX_UPLOAD_BYTES",
];

const saved: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) saved[key] = process.env[key];

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function harness(env: Record<string, string>) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, env);

  let now = 1_000_000;
  const bans = new Map<string, number>();
  const written: string[] = [];
  const evaluate = createShieldEvaluator({
    now: () => now,
    readBan: async (ip) => bans.get(ip) ?? null,
    writeBan: async (ip, until) => {
      bans.set(ip, until);
      written.push(ip);
    },
  });
  return { evaluate, bans, written, tick: (ms: number) => (now += ms) };
}

const req = (partial: Partial<ShieldInput>): ShieldInput => ({
  ip: "1.2.3.4",
  pathname: "/",
  method: "GET",
  contentLength: null,
  ...partial,
});

describe("evaluateShield", () => {
  test("passes normal traffic", async () => {
    const { evaluate } = harness({ SHIELD_PAGE_LIMIT: "3" });
    for (let i = 0; i < 3; i += 1) {
      expect((await evaluate(req({}))).action).toBe("pass");
    }
  });

  test("rate-limits an IP that trips its class window", async () => {
    const { evaluate } = harness({ SHIELD_PAGE_LIMIT: "2" });
    await evaluate(req({}));
    await evaluate(req({}));
    const verdict = await evaluate(req({}));
    expect(verdict).toMatchObject({
      action: "reject",
      status: 429,
      reason: "rate_limited",
    });
  });

  test("tracks limits per class, not per site", async () => {
    const { evaluate } = harness({
      SHIELD_PAGE_LIMIT: "1",
      SHIELD_API_LIMIT: "5",
    });
    await evaluate(req({ pathname: "/" }));
    expect((await evaluate(req({ pathname: "/" }))).action).toBe("reject");
    expect((await evaluate(req({ pathname: "/api/bookings" }))).action).toBe(
      "pass",
    );
  });

  test("promotes repeat offenders to a shared ban", async () => {
    const { evaluate, written, tick } = harness({
      SHIELD_PAGE_LIMIT: "1",
      SHIELD_BAN_STRIKES: "2",
      SHIELD_WINDOW_MS: "1000",
      SHIELD_BAN_SECONDS: "600",
    });
    // Trip the per-IP window in two separate windows: the second strike
    // crosses the threshold and publishes the shared ban.
    await evaluate(req({}));
    await evaluate(req({}));
    tick(1001);
    await evaluate(req({}));
    await evaluate(req({}));
    expect(written).toEqual(["1.2.3.4"]);
    // The ban is mirrored in memory: subsequent requests reject instantly.
    tick(1001);
    const verdict = await evaluate(req({}));
    expect(verdict).toMatchObject({ status: 429, reason: "banned" });
  });

  test("honors a longer remote ban from another instance", async () => {
    const h = harness({
      SHIELD_PAGE_LIMIT: "1",
      SHIELD_BAN_STRIKES: "1",
      SHIELD_BAN_SECONDS: "60",
    });
    h.bans.set("1.2.3.4", 1_000_000 + 9_000_000); // remote ban ~2.5h out
    await h.evaluate(req({}));
    const verdict = await h.evaluate(req({}));
    expect(verdict.action).toBe("reject");
    if (verdict.action === "reject") {
      expect(verdict.retryAfterSec).toBeGreaterThan(60);
    }
  });

  test("sheds global overload with 503 and never bans for it", async () => {
    const { evaluate, written } = harness({
      SHIELD_GLOBAL_RPS: "2",
      SHIELD_PAGE_LIMIT: "999999",
    });
    await evaluate(req({ ip: "a" }));
    await evaluate(req({ ip: "b" }));
    const verdict = await evaluate(req({ ip: "c" }));
    expect(verdict).toMatchObject({ status: 503, reason: "overloaded" });
    expect(written).toEqual([]);
  });

  test("rejects declared oversized bodies before the window check", async () => {
    const { evaluate } = harness({ SHIELD_MAX_JSON_BYTES: "100" });
    const verdict = await evaluate(
      req({ method: "POST", pathname: "/api/bookings", contentLength: "5000" }),
    );
    expect(verdict).toMatchObject({ status: 413, reason: "body_too_large" });
  });

  test("uploads use the larger media cap", async () => {
    const { evaluate } = harness({
      SHIELD_MAX_JSON_BYTES: "100",
      SHIELD_MAX_UPLOAD_BYTES: "10000",
    });
    const verdict = await evaluate(
      req({ method: "POST", pathname: "/api/media", contentLength: "5000" }),
    );
    expect(verdict.action).toBe("pass");
  });

  test("fails open to a local ban when the ban store is down", async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, {
      SHIELD_PAGE_LIMIT: "1",
      SHIELD_BAN_STRIKES: "1",
    });
    const now = 0;
    const evaluate = createShieldEvaluator({
      now: () => now,
      readBan: async () => {
        throw new Error("scylla down");
      },
      writeBan: async () => {},
    });
    await evaluate(req({}));
    const verdict = await evaluate(req({}));
    expect(verdict).toMatchObject({ status: 429, reason: "banned" });
  });
});
