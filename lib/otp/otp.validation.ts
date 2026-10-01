// Input validation for the two OTP endpoints. Vietnamese messages: they are
// surfaced directly in the lookup form.
import { normalizeEmail, validateEmail } from "@/lib/auth/validation";
import { isOtpPurpose, type OtpPurpose } from "./otp.types";

export type OtpRequestInput = { email?: unknown; purpose?: unknown };
export type OtpVerifyInput = OtpRequestInput & { code?: unknown };

export type NormalizedOtpTarget = { email: string; purpose: OtpPurpose };

export type OtpRequestErrors = {
  form?: string;
  email?: string;
};

export function normalizeOtpTarget(
  input: OtpRequestInput,
): { value: NormalizedOtpTarget } | { errors: OtpRequestErrors } {
  const errors: OtpRequestErrors = {};

  if (!isOtpPurpose(input.purpose)) {
    errors.form = "Loại xác minh không hợp lệ.";
    return { errors };
  }

  const emailError = validateEmail(
    typeof input.email === "string" ? input.email : "",
  );
  if (emailError) {
    errors.email = emailError;
    return { errors };
  }

  return {
    value: {
      email: normalizeEmail(String(input.email)),
      purpose: input.purpose,
    },
  };
}

/** Strips the spaces people paste out of the email client. */
export function normalizeOtpCode(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, "") : "";
}

export function validateOtpVerifyInput(
  input: OtpVerifyInput,
):
  | { value: NormalizedOtpTarget & { code: string } }
  | { errors: OtpRequestErrors & { code?: string } } {
  const target = normalizeOtpTarget(input);
  if ("errors" in target) return target;

  const code = normalizeOtpCode(input.code);
  if (!code) {
    return { errors: { code: "Vui lòng nhập mã xác minh." } };
  }
  if (!/^\d{6}$/.test(code)) {
    return { errors: { code: "Mã xác minh gồm 6 chữ số." } };
  }
  return { value: { ...target.value, code } };
}
