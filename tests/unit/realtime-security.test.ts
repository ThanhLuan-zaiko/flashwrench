import { afterEach, describe, expect, test } from "bun:test";
import { isAllowedRealtimeOrigin } from "@/realtime/security";

afterEach(() => {
  delete process.env.REALTIME_ALLOWED_ORIGINS;
});

describe("isAllowedRealtimeOrigin", () => {
  test("allows non-browser clients without an Origin header", () => {
    expect(isAllowedRealtimeOrigin("http://127.0.0.1:3001/ws", null)).toBe(
      true,
    );
  });

  test("allows same-host origins regardless of port", () => {
    expect(
      isAllowedRealtimeOrigin(
        "http://127.0.0.1:3001/ws",
        "http://127.0.0.1:3000",
      ),
    ).toBe(true);
    expect(
      isAllowedRealtimeOrigin(
        "https://app.example.com/ws",
        "https://app.example.com",
      ),
    ).toBe(true);
  });

  test("denies cross-origin, cross-scheme, and unparsable values", () => {
    expect(
      isAllowedRealtimeOrigin(
        "http://127.0.0.1:3001/ws",
        "https://evil.example",
      ),
    ).toBe(false);
    expect(
      isAllowedRealtimeOrigin(
        "http://127.0.0.1:3001/ws",
        "http://evil127.0.0.1:3001",
      ),
    ).toBe(false);
    expect(
      isAllowedRealtimeOrigin(
        "https://app.example.com/ws",
        "http://app.example.com",
      ),
    ).toBe(false);
    expect(isAllowedRealtimeOrigin("http://127.0.0.1:3001/ws", "null")).toBe(
      false,
    );
    expect(
      isAllowedRealtimeOrigin("http://127.0.0.1:3001/ws", "not a url"),
    ).toBe(false);
    expect(isAllowedRealtimeOrigin("http://127.0.0.1:3001/ws", "")).toBe(false);
    expect(isAllowedRealtimeOrigin("::bad::", "http://127.0.0.1:3000")).toBe(
      false,
    );
  });

  test("honors the configured allowlist with exact origin matching", () => {
    const configured = "https://app.example.com, https://admin.example.com";
    expect(
      isAllowedRealtimeOrigin(
        "http://10.0.0.5:3001/ws",
        "https://app.example.com",
        configured,
      ),
    ).toBe(true);
    expect(
      isAllowedRealtimeOrigin(
        "http://10.0.0.5:3001/ws",
        "https://sub.app.example.com",
        configured,
      ),
    ).toBe(false);
    expect(
      isAllowedRealtimeOrigin(
        "http://10.0.0.5:3001/ws",
        "http://10.0.0.5:3000",
        configured,
      ),
    ).toBe(false);
    expect(isAllowedRealtimeOrigin("http://10.0.0.5:3001/ws", null)).toBe(true);
  });

  test("reads REALTIME_ALLOWED_ORIGINS when not passed explicitly", () => {
    process.env.REALTIME_ALLOWED_ORIGINS = "https://app.example.com";
    try {
      expect(
        isAllowedRealtimeOrigin(
          "http://10.0.0.5:3001/ws",
          "https://app.example.com",
        ),
      ).toBe(true);
      expect(
        isAllowedRealtimeOrigin(
          "http://10.0.0.5:3001/ws",
          "http://10.0.0.5:3000",
        ),
      ).toBe(false);
    } finally {
      delete process.env.REALTIME_ALLOWED_ORIGINS;
    }
  });
});
