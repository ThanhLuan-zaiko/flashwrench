// Pure sanitizer for the lookup OTP field. No mocks, no I/O.
import { describe, expect, test } from "bun:test";
import {
  isCompleteOtpCode,
  sanitizeOtpInput,
} from "@/components/guest-access/guest-otp-format";

describe("sanitizeOtpInput", () => {
  test("keeps only digits and caps at six", () => {
    expect(sanitizeOtpInput("123456")).toBe("123456");
    expect(sanitizeOtpInput("12a3b4c56")).toBe("123456");
    expect(sanitizeOtpInput("123456789")).toBe("123456");
  });

  test("strips spaces pasted from mail clients", () => {
    expect(sanitizeOtpInput(" 123 456 ")).toBe("123456");
    expect(sanitizeOtpInput("123\n456")).toBe("123456");
  });

  test("returns empty for a non-numeric value", () => {
    expect(sanitizeOtpInput("abcdef")).toBe("");
    expect(sanitizeOtpInput("")).toBe("");
  });
});

describe("isCompleteOtpCode", () => {
  test("accepts exactly six digits", () => {
    expect(isCompleteOtpCode("123456")).toBe(true);
    expect(isCompleteOtpCode("042158")).toBe(true);
  });

  test("rejects short, long, or non-digit codes", () => {
    for (const code of ["12345", "1234567", "abcdef", "12345a", ""]) {
      expect(isCompleteOtpCode(code)).toBe(false);
    }
  });
});
