// Input validation for the two OTP endpoints, plus the email template.
// The service trusts these normalizers, so the edge cases matter: a purpose
// from an unknown future feature must not be accepted, and a code pasted
// with stray whitespace still has to verify.
import { describe, expect, test } from "bun:test";
import { buildOtpEmail } from "@/lib/mail/otp-email";
import {
  normalizeOtpCode,
  normalizeOtpTarget,
  validateOtpVerifyInput,
} from "@/lib/otp/otp.validation";

describe("normalizeOtpTarget", () => {
  test("lowercases and trims the address", () => {
    const target = normalizeOtpTarget({
      email: "  An@Example.COM ",
      purpose: "guest_access",
    });
    expect(target).toEqual({
      value: { email: "an@example.com", purpose: "guest_access" },
    });
  });

  test("rejects a missing or malformed purpose", () => {
    for (const purpose of [undefined, "", "password_reset", 42, null]) {
      const target = normalizeOtpTarget({ email: "a@b.co", purpose });
      expect("errors" in target).toBe(true);
    }
  });

  test("reports a bad address under the email field", () => {
    const target = normalizeOtpTarget({
      email: "khong-phai-email",
      purpose: "guest_access",
    });
    expect("errors" in target).toBe(true);
    if (!("errors" in target)) return;
    expect(target.errors.email).toContain("email");
  });

  test("rejects a non-string address", () => {
    const target = normalizeOtpTarget({ email: 123, purpose: "guest_access" });
    expect("errors" in target).toBe(true);
  });
});

describe("normalizeOtpCode", () => {
  test("strips the whitespace mail clients inject", () => {
    expect(normalizeOtpCode(" 123 456 ")).toBe("123456");
    expect(normalizeOtpCode("123\n456")).toBe("123456");
  });

  test("returns an empty string for anything that is not a string", () => {
    expect(normalizeOtpCode(undefined)).toBe("");
    expect(normalizeOtpCode(null)).toBe("");
    expect(normalizeOtpCode(123456)).toBe("");
  });
});

describe("validateOtpVerifyInput", () => {
  test("accepts a six-digit code with spaces", () => {
    const checked = validateOtpVerifyInput({
      email: "a@b.co",
      code: "123 456",
      purpose: "guest_access",
    });
    expect(checked).toEqual({
      value: { email: "a@b.co", purpose: "guest_access", code: "123456" },
    });
  });

  test("rejects a missing code", () => {
    const checked = validateOtpVerifyInput({
      email: "a@b.co",
      purpose: "guest_access",
    });
    expect("errors" in checked).toBe(true);
    if (!("errors" in checked)) return;
    expect(checked.errors.code).toContain("mã xác minh");
  });

  test("rejects a code that is not exactly six digits", () => {
    for (const code of ["12345", "1234567", "abcdef", "12345a"]) {
      const checked = validateOtpVerifyInput({
        email: "a@b.co",
        code,
        purpose: "guest_access",
      });
      expect("errors" in checked).toBe(true);
      if (!("errors" in checked)) return;
      expect(checked.errors.code).toContain("6 chữ số");
    }
  });

  test("surfaces the target errors when the address is unusable", () => {
    const checked = validateOtpVerifyInput({
      email: "nope",
      code: "123456",
      purpose: "guest_access",
    });
    expect("errors" in checked).toBe(true);
    if (!("errors" in checked)) return;
    expect(checked.errors.email).toContain("email");
  });
});

describe("buildOtpEmail", () => {
  const content = buildOtpEmail("an@example.com", "042158", "xem lại hóa đơn");

  test("puts the code in the subject so it is visible in a notification", () => {
    expect(content.subject).toContain("042158");
  });

  test("carries both a plain-text and an HTML alternative", () => {
    expect(content.text).toContain("042158");
    expect(content.html).toContain("042158");
    expect(content.html).toContain("<html");
  });

  test("never echoes the full address back", () => {
    expect(content.text).not.toContain("an@example.com");
    expect(content.html).not.toContain("an@example.com");
  });

  test("tells the reader to ignore the mail if they did not ask for it", () => {
    expect(content.text).toContain("bỏ qua");
  });
});
