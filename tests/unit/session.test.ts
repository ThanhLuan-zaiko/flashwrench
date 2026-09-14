import { describe, expect, test } from "bun:test";
import {
  ACCESS_TTL_SECONDS,
  accessCookieOptions,
  createRefreshToken,
  hashToken,
  parseRefreshToken,
  REFRESH_TTL_SECONDS,
  refreshCookieOptions,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/auth/session";

const TEST_SECRET = "test-only-secret-with-at-least-32-chars!!";

describe("access tokens", () => {
  test("sign then verify returns the original claims", async () => {
    process.env.AUTH_SECRET = TEST_SECRET;
    const token = await signAccessToken("user-1", 3);
    expect(await verifyAccessToken(token)).toEqual({
      userId: "user-1",
      tokenVersion: 3,
    });
  });

  test("rejects tampered tokens", async () => {
    process.env.AUTH_SECRET = TEST_SECRET;
    const token = await signAccessToken("user-1", 0);
    const tampered = `${token.slice(0, -2)}ab`;
    expect(await verifyAccessToken(tampered)).toBeNull();
    expect(await verifyAccessToken("not-a-token")).toBeNull();
  });

  test("rejects tokens signed with a different secret", async () => {
    process.env.AUTH_SECRET = TEST_SECRET;
    const token = await signAccessToken("user-1", 0);
    process.env.AUTH_SECRET = "another-test-secret-with-32-chars-min!";
    expect(await verifyAccessToken(token)).toBeNull();
    process.env.AUTH_SECRET = TEST_SECRET;
  });
});

describe("refresh tokens", () => {
  test("create then parse returns user and family", () => {
    const created = createRefreshToken("user-1");
    expect(parseRefreshToken(created.token)).toEqual({
      userId: "user-1",
      familyId: created.familyId,
    });
  });

  test("hash is stable and parse rejects garbage", () => {
    const created = createRefreshToken("user-1", "family-1");
    expect(hashToken(created.token)).toBe(hashToken(created.token));
    expect(hashToken("other")).not.toBe(hashToken(created.token));
    expect(parseRefreshToken("garbage")).toBeNull();
    expect(parseRefreshToken("fw1.only-two")).toBeNull();
    expect(parseRefreshToken(created.token.replace("fw1.", "fw2."))).toBeNull();
  });
});

describe("cookie options", () => {
  test("access cookies are httpOnly, lax and short-lived", () => {
    const options = accessCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(ACCESS_TTL_SECONDS);
  });

  test("refresh cookies live much longer than access cookies", () => {
    const options = refreshCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.maxAge).toBe(REFRESH_TTL_SECONDS);
    expect(REFRESH_TTL_SECONDS).toBeGreaterThan(ACCESS_TTL_SECONDS);
  });
});
