import { describe, expect, test } from "bun:test";
import {
  canApplyRescueAction,
  isRescueMechanicAction,
  isRescueOfferExpired,
  RESCUE_OFFER_TIMEOUT_MS,
  rescueActionTarget,
  rescueProgressStep,
} from "@/lib/rescue/rescue-status";

// Pure dispatch rules: one offer lives 30s, mechanics only answer
// dispatched rows, expiry is time-based. Journey actions drive the
// rescue forward after the offer is accepted. No React, no mocks.
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

describe("rescue journey rules", () => {
  test("journey actions follow accepted → en_route → arrived → completed", () => {
    expect(canApplyRescueAction("depart", "accepted")).toBe(true);
    expect(canApplyRescueAction("depart", "dispatched")).toBe(false);
    expect(canApplyRescueAction("depart", "en_route")).toBe(false);

    expect(canApplyRescueAction("arrive", "en_route")).toBe(true);
    expect(canApplyRescueAction("arrive", "accepted")).toBe(false);
    expect(canApplyRescueAction("arrive", "dispatched")).toBe(false);

    expect(canApplyRescueAction("complete", "arrived")).toBe(true);
    expect(canApplyRescueAction("complete", "en_route")).toBe(true);
    expect(canApplyRescueAction("complete", "accepted")).toBe(false);
    expect(canApplyRescueAction("complete", "completed")).toBe(false);
  });

  test("terminal states accept no mechanic actions", () => {
    for (const action of [
      "accept",
      "decline",
      "depart",
      "arrive",
      "complete",
    ] as const) {
      expect(canApplyRescueAction(action, "completed")).toBe(false);
      expect(canApplyRescueAction(action, "cancelled")).toBe(false);
    }
  });

  test("action targets map to the next status", () => {
    expect(rescueActionTarget("accept")).toBe("accepted");
    expect(rescueActionTarget("depart")).toBe("en_route");
    expect(rescueActionTarget("arrive")).toBe("arrived");
    expect(rescueActionTarget("complete")).toBe("completed");
    expect(rescueActionTarget("decline")).toBe("open");
  });

  test("isRescueMechanicAction covers journey actions", () => {
    for (const action of [
      "accept",
      "decline",
      "expire",
      "depart",
      "arrive",
      "complete",
    ]) {
      expect(isRescueMechanicAction(action)).toBe(true);
    }
    expect(isRescueMechanicAction("flying")).toBe(false);
    expect(isRescueMechanicAction(null)).toBe(false);
  });
});

describe("rescueProgressStep", () => {
  test("maps statuses onto the customer progress ladder", () => {
    expect(rescueProgressStep("open")).toBe("received");
    expect(rescueProgressStep("dispatched")).toBe("finding");
    expect(rescueProgressStep("accepted")).toBe("finding");
    expect(rescueProgressStep("en_route")).toBe("en_route");
    expect(rescueProgressStep("arrived")).toBe("arrived");
    expect(rescueProgressStep("completed")).toBe("completed");
    expect(rescueProgressStep("cancelled")).toBe("cancelled");
    expect(rescueProgressStep(null)).toBe("received");
    expect(rescueProgressStep("flying")).toBe("received");
  });
});
