import { describe, expect, test } from "bun:test";
import {
  canApplyRescueAction,
  isRescueOfferExpired,
  RESCUE_OFFER_TIMEOUT_MS,
} from "@/lib/rescue/rescue-status";

// Pure dispatch rules: one offer lives 30s, mechanics only answer
// dispatched rows, expiry is time-based. No React, no mocks.
describe("rescue dispatch rules", () => {
  test("offer timeout is 30s", () => {
    expect(RESCUE_OFFER_TIMEOUT_MS).toBe(30_000);
  });

  test("accept and decline only from dispatched", () => {
    expect(canApplyRescueAction("accept", "dispatched")).toBe(true);
    expect(canApplyRescueAction("decline", "dispatched")).toBe(true);
    expect(canApplyRescueAction("accept", "open")).toBe(false);
    expect(canApplyRescueAction("decline", "open")).toBe(false);
    expect(canApplyRescueAction("accept", "accepted")).toBe(false);
  });

  test("offer expires after 30s", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(
      isRescueOfferExpired(start, new Date(start.getTime() + 29_999)),
    ).toBe(false);
    expect(
      isRescueOfferExpired(start, new Date(start.getTime() + 30_000)),
    ).toBe(true);
    expect(isRescueOfferExpired(null)).toBe(false);
  });
});
