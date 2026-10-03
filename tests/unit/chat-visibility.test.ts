// Gate for the guest-visible chat surface: the FAB stays mounted for
// everyone, only customers and mechanics unlock the inbox. Pure module, so
// no mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import { canUseChat, getChatEmptyActions } from "@/lib/chat/chat-visibility";

describe("canUseChat", () => {
  test("unlocks customers and mechanics", () => {
    expect(canUseChat("customer")).toBe(true);
    expect(canUseChat("mechanic")).toBe(true);
  });

  test("locks guests and unknown sessions", () => {
    expect(canUseChat(null)).toBe(false);
    expect(canUseChat(undefined)).toBe(false);
  });

  test("locks staff roles without a booking inbox", () => {
    expect(canUseChat("admin")).toBe(false);
    expect(canUseChat("dispatcher")).toBe(false);
  });
});

describe("getChatEmptyActions", () => {
  test("offers in-app shortcuts into the booking flow", () => {
    const actions = getChatEmptyActions();
    expect(actions.map((action) => action.href)).toEqual([
      "/services",
      "/booking",
    ]);
  });

  test("uses labeled internal paths only", () => {
    for (const action of getChatEmptyActions()) {
      expect(action.label.trim().length).toBeGreaterThan(0);
      expect(action.href.startsWith("/")).toBe(true);
      expect(action.href.includes("://")).toBe(false);
    }
  });
});
