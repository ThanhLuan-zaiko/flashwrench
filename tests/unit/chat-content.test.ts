// Pure content guards for multi-kind chat messages: kind parsing, image
// URL allowlisting, location round-trips and inbox previews. No mocks.
import { describe, expect, test } from "bun:test";
import {
  chatContentPreview,
  chatLocationMapUrl,
  formatChatLocation,
  isChatImageUrl,
  normalizeMessageKind,
  parseChatLocation,
  parseMessageKind,
} from "@/lib/chat/chat-content";

describe("parseMessageKind", () => {
  test("accepts the three known kinds", () => {
    expect(parseMessageKind("text")).toBe("text");
    expect(parseMessageKind("image")).toBe("image");
    expect(parseMessageKind("location")).toBe("location");
  });

  test("rejects unknown, empty and non-string kinds", () => {
    for (const value of ["video", "", null, undefined, 42, {}]) {
      expect(parseMessageKind(value)).toBeNull();
    }
  });
});

describe("normalizeMessageKind", () => {
  test("degrades legacy and future kinds to text", () => {
    expect(normalizeMessageKind(null)).toBe("text");
    expect(normalizeMessageKind(undefined)).toBe("text");
    expect(normalizeMessageKind("video")).toBe("text");
    expect(normalizeMessageKind("image")).toBe("image");
  });
});

describe("isChatImageUrl", () => {
  test("accepts our own immutable upload URLs", () => {
    expect(isChatImageUrl("/api/media/misc/2026-10/a1b2.webp")).toBe(true);
  });

  test("rejects external, data and malformed URLs", () => {
    for (const value of [
      "https://cdn.example/a.jpg",
      "data:image/png;base64,aaa",
      "javascript:alert(1)",
      "/api/media/misc/a b.jpg",
      "/api/media/",
      "x".repeat(600),
      null,
      undefined,
      42,
    ]) {
      expect(isChatImageUrl(value)).toBe(false);
    }
  });
});

describe("chat location", () => {
  test("parses and formats a Saigon fix", () => {
    expect(parseChatLocation("10.762622,106.660172")).toEqual({
      lat: 10.762622,
      lng: 106.660172,
    });
    expect(formatChatLocation({ lat: 10.762622, lng: 106.660172 })).toBe(
      "10.762622,106.660172",
    );
  });

  test("rejects out-of-range and malformed bodies", () => {
    for (const value of [
      "91,0",
      "0,181",
      "abc,def",
      "10.1",
      "10.1,106.2,3",
      ",",
      " , ",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(parseChatLocation(value)).toBeNull();
    }
  });

  test("map link points at the shared fix", () => {
    const url = chatLocationMapUrl({ lat: 10.762622, lng: 106.660172 });
    expect(url).toContain("openstreetmap.org");
    expect(url).toContain("10.762622");
    expect(url).toContain("106.660172");
  });
});

describe("chatContentPreview", () => {
  test("uses fixed Vietnamese lines for attachments", () => {
    expect(chatContentPreview("image", "/api/media/misc/a.webp")).toBe(
      "Đã gửi một hình ảnh",
    );
    expect(chatContentPreview("location", "10.1,106.2")).toBe(
      "Đã chia sẻ vị trí",
    );
  });

  test("truncates long text like the legacy preview", () => {
    expect(chatContentPreview("text", "x".repeat(200))).toBe(
      `${"x".repeat(117)}...`,
    );
    expect(chatContentPreview("text", "ngắn")).toBe("ngắn");
  });
});
