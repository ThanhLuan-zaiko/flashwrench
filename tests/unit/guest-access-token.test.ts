// The signed cookie that backs the guest-access session. Pure crypto over a
// string: a round trip proves the happy path, and the tamper/expiry cases
// prove the signature is the only thing standing between a forged address
// and someone's invoices.
import { describe, expect, test } from "bun:test";
import {
  createGuestAccessToken,
  GUEST_ACCESS_TTL_SECONDS,
  parseGuestAccessToken,
} from "@/lib/auth/guest-access";

const EMAIL = "an@example.com";

describe("createGuestAccessToken / parseGuestAccessToken", () => {
  test("round-trips the verified address", () => {
    const token = createGuestAccessToken(EMAIL);
    expect(parseGuestAccessToken(token)).toEqual({ email: EMAIL });
  });

  test("carries its own expiry, so no session row is needed", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const token = createGuestAccessToken(EMAIL, now);
    // Still valid one second before the window closes.
    const almost = new Date(
      now.getTime() + (GUEST_ACCESS_TTL_SECONDS - 1) * 1000,
    );
    expect(parseGuestAccessToken(token, almost)).toEqual({ email: EMAIL });
  });

  test("rejects an expired token", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const token = createGuestAccessToken(EMAIL, now);
    const later = new Date(
      now.getTime() + (GUEST_ACCESS_TTL_SECONDS + 1) * 1000,
    );
    expect(parseGuestAccessToken(token, later)).toBeNull();
  });

  test("rejects a tampered payload", () => {
    const token = createGuestAccessToken(EMAIL);
    const [prefix, payload, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ e: "attacker@evil.co", x: 99999999999 }),
      "utf8",
    ).toString("base64url");
    // Swapping the address while keeping the old signature must fail.
    expect(
      parseGuestAccessToken(`${prefix}.${forged}.${signature}`),
    ).toBeNull();
    expect(payload).not.toBe(forged);
  });

  test("rejects a tampered signature", () => {
    const token = createGuestAccessToken(EMAIL);
    const [prefix, payload, signature] = token.split(".");
    const flipped = `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;
    expect(parseGuestAccessToken(`${prefix}.${payload}.${flipped}`)).toBeNull();
  });

  test("rejects missing, empty and structurally wrong values", () => {
    expect(parseGuestAccessToken(undefined)).toBeNull();
    expect(parseGuestAccessToken("")).toBeNull();
    expect(parseGuestAccessToken("not-a-token")).toBeNull();
    expect(parseGuestAccessToken("fwg1.only-two")).toBeNull();
    // Right shape, wrong prefix: a real session token must not be accepted.
    const real = createGuestAccessToken(EMAIL);
    expect(parseGuestAccessToken(real.replace("fwg1.", "fwg2."))).toBeNull();
  });

  test("rejects a payload that is not the expected JSON", () => {
    const payload = Buffer.from(
      JSON.stringify({ e: 42, x: "soon" }),
      "utf8",
    ).toString("base64url");
    // Signature is valid for this payload, but the claims have the wrong
    // types, so parsing must fail on shape rather than trust the signature.
    const forged = `fwg1.${payload}.${"x".repeat(43)}`;
    expect(parseGuestAccessToken(forged)).toBeNull();
  });
});
