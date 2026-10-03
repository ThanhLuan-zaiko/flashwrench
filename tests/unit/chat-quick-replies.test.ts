// Role-aware canned replies: customers ask for status, mechanics send
// roadside updates, everyone else gets nothing. No mocks.
import { describe, expect, test } from "bun:test";
import { getChatQuickReplies } from "@/lib/chat/chat-quick-replies";

describe("getChatQuickReplies", () => {
  test("returns five customer prompts", () => {
    const replies = getChatQuickReplies("customer");
    expect(replies).toHaveLength(5);
    expect(replies[0]).toContain("Thợ");
  });

  test("returns five mechanic updates", () => {
    const replies = getChatQuickReplies("mechanic");
    expect(replies).toHaveLength(5);
    expect(replies[0]).toContain("đường");
  });

  test("returns nothing for staff, guests and unknown roles", () => {
    for (const role of ["dispatcher", "admin", null, undefined] as const) {
      expect(getChatQuickReplies(role)).toEqual([]);
    }
  });

  test("returns a fresh copy on every call", () => {
    const first = getChatQuickReplies("customer");
    first.push("mutated");
    expect(getChatQuickReplies("customer")).toHaveLength(5);
  });
});
