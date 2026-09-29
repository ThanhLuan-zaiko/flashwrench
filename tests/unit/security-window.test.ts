import { describe, expect, test } from "bun:test";
import { FixedWindowCounter } from "@/lib/security/fixed-window";

// Pure logic only: the counter takes an injectable clock so tests move
// time explicitly instead of sleeping.

describe("FixedWindowCounter", () => {
  test("allows hits under the limit", () => {
    const now = 1_000_000;
    const counter = new FixedWindowCounter(() => now);
    for (let i = 0; i < 5; i += 1) {
      expect(counter.hit("ip:1", 5, 10_000).allowed).toBe(true);
    }
  });

  test("rejects at the limit and reports a retry delay", () => {
    const now = 1_000_000;
    const counter = new FixedWindowCounter(() => now);
    for (let i = 0; i < 3; i += 1) counter.hit("ip:1", 3, 10_000);
    const blocked = counter.hit("ip:1", 3, 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(10);
  });

  test("resets once the window rolls over", () => {
    let now = 1_000_000;
    const counter = new FixedWindowCounter(() => now);
    counter.hit("ip:1", 1, 10_000);
    expect(counter.hit("ip:1", 1, 10_000).allowed).toBe(false);
    now += 10_001;
    expect(counter.hit("ip:1", 1, 10_000).allowed).toBe(true);
  });

  test("keeps keys independent", () => {
    const counter = new FixedWindowCounter(() => 0);
    counter.hit("a", 1, 10_000);
    expect(counter.hit("a", 1, 10_000).allowed).toBe(false);
    expect(counter.hit("b", 1, 10_000).allowed).toBe(true);
  });

  test("tracks counts via peek", () => {
    const counter = new FixedWindowCounter(() => 0);
    counter.hit("a", 10, 10_000);
    counter.hit("a", 10, 10_000);
    expect(counter.peek("a")).toBe(2);
    expect(counter.peek("missing")).toBe(0);
  });
});
