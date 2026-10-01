// Pure OTP primitives: code shape, storage hashing and constant-time
// comparison. No mocks, no I/O — the pepper comes from the same env the
// service uses.
import { describe, expect, test } from "bun:test";
import { maskEmail } from "@/lib/mail/otp-email";
import { hashOtp, newOtpCode, verifyOtpHash } from "@/lib/otp/otp-code";

describe("newOtpCode", () => {
  test("always yields exactly six digits", () => {
    for (let i = 0; i < 500; i += 1) {
      expect(newOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  test("zero-pads low values so codes never lose a leading digit", () => {
    // 500 draws make a "no padding" implementation almost certain to emit a
    // short code, which would silently break the six-digit check.
    const codes = Array.from({ length: 500 }, () => newOtpCode());
    expect(codes.every((code) => code.length === 6)).toBe(true);
    expect(codes.some((code) => code.startsWith("0"))).toBe(true);
  });
});

describe("hashOtp", () => {
  test("is deterministic for the same address, purpose and code", () => {
    const a = hashOtp("a@b.co", "guest_access", "123456");
    const b = hashOtp("a@b.co", "guest_access", "123456");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  test("binds the digest to its row", () => {
    const base = hashOtp("a@b.co", "guest_access", "123456");
    // Moving a captured hash to another address or purpose must not verify.
    expect(hashOtp("other@b.co", "guest_access", "123456")).not.toBe(base);
    expect(hashOtp("a@b.co", "password_reset", "123456")).not.toBe(base);
    expect(hashOtp("a@b.co", "guest_access", "654321")).not.toBe(base);
  });

  test("never leaks the plaintext code", () => {
    expect(hashOtp("a@b.co", "guest_access", "123456")).not.toContain("123456");
  });
});

describe("verifyOtpHash", () => {
  const email = "a@b.co";
  const purpose = "guest_access";

  test("accepts the matching code and rejects every other one", () => {
    const stored = hashOtp(email, purpose, "123456");
    expect(verifyOtpHash(email, purpose, "123456", stored)).toBe(true);
    expect(verifyOtpHash(email, purpose, "123457", stored)).toBe(false);
    expect(verifyOtpHash(email, purpose, "", stored)).toBe(false);
  });

  test("rejects a hash captured from another row", () => {
    const stored = hashOtp("other@b.co", purpose, "123456");
    expect(verifyOtpHash(email, purpose, "123456", stored)).toBe(false);
  });

  test("rejects a malformed or empty stored hash without throwing", () => {
    expect(verifyOtpHash(email, purpose, "123456", "")).toBe(false);
    expect(verifyOtpHash(email, purpose, "123456", "not-a-hash")).toBe(false);
  });
});

describe("maskEmail", () => {
  test("keeps the first two local characters and the domain", () => {
    // "nguyen.vanan" is 12 characters, so 10 are starred.
    expect(maskEmail("nguyen.vanan@example.com")).toBe(
      "ng**********@example.com",
    );
  });

  test("never returns the full local part for a short address", () => {
    // "ab@x.co" would otherwise mask to nothing and echo the whole thing.
    expect(maskEmail("ab@x.co")).not.toBe("ab@x.co");
  });

  test("passes through a value with no local part", () => {
    expect(maskEmail("@example.com")).toBe("@example.com");
  });
});
