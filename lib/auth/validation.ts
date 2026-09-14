import type {
  ChangePasswordInput,
  FieldErrors,
  LoginInput,
  RegisterInput,
} from "./user.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VIETNAM_MOBILE_RE = /^0[35789]\d{8}$/;
const LETTER_RE = /[A-Za-zÀ-ỹ]/;
const DIGIT_RE = /\d/;

export const REGISTER_LIMITS = {
  fullNameMin: 2,
  fullNameMax: 100,
  passwordMin: 8,
  passwordMax: 72,
  emailMax: 254,
} as const;

export function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/[\s.\-()]/g, "");
  // Accept common VN formats for the same number: +849..., 849...,
  // 00849... all map to 09... so dedup checks cannot be bypassed.
  if (cleaned.startsWith("+84")) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith("0084")) return `0${cleaned.slice(4)}`;
  if (/^84\d{9}$/.test(cleaned)) return `0${cleaned.slice(2)}`;
  return cleaned;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isEmail(value: string): boolean {
  return value.includes("@");
}

export function validateFullName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "Vui lòng nhập họ và tên.";
  if (name.length < REGISTER_LIMITS.fullNameMin)
    return "Họ và tên phải có ít nhất 2 ký tự.";
  if (name.length > REGISTER_LIMITS.fullNameMax)
    return "Họ và tên không được quá 100 ký tự.";
  return null;
}

export function validatePhone(raw: string): string | null {
  const phone = normalizePhone(raw);
  if (!phone) return "Vui lòng nhập số điện thoại.";
  if (!VIETNAM_MOBILE_RE.test(phone))
    return "Số điện thoại không hợp lệ. Ví dụ đúng: 0912345678.";
  return null;
}

export function validateEmail(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (!email) return "Vui lòng nhập địa chỉ email.";
  if (email.length > REGISTER_LIMITS.emailMax) return "Địa chỉ email quá dài.";
  if (!EMAIL_RE.test(email)) return "Địa chỉ email không hợp lệ.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (value.length < REGISTER_LIMITS.passwordMin)
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (value.length > REGISTER_LIMITS.passwordMax)
    return "Mật khẩu không được quá 72 ký tự.";
  if (!LETTER_RE.test(value) || !DIGIT_RE.test(value))
    return "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số.";
  return null;
}

export function validateRegisterInput(
  input: RegisterInput,
): FieldErrors | null {
  const errors: FieldErrors = {};

  const fullNameError = validateFullName(input.fullName ?? "");
  if (fullNameError) errors.fullName = fullNameError;

  const phoneError = validatePhone(input.phone ?? "");
  if (phoneError) errors.phone = phoneError;

  const emailError = validateEmail(input.email ?? "");
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password ?? "");
  if (passwordError) errors.password = passwordError;

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Mật khẩu nhập lại không khớp.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateLoginInput(input: LoginInput): FieldErrors | null {
  const errors: FieldErrors = {};
  const identifier = (input.identifier ?? "").trim();

  if (!identifier) {
    errors.identifier = "Vui lòng nhập số điện thoại hoặc email.";
  } else if (isEmail(identifier)) {
    const emailError = validateEmail(identifier);
    if (emailError) errors.identifier = emailError;
  } else {
    const phoneError = validatePhone(identifier);
    if (phoneError)
      errors.identifier = "Số điện thoại hoặc email không hợp lệ.";
  }

  if (!input.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (input.password.length < REGISTER_LIMITS.passwordMin) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateChangePasswordInput(
  input: ChangePasswordInput,
): FieldErrors | null {
  const errors: FieldErrors = {};

  if (!input.currentPassword) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  const newPasswordError = validatePassword(input.newPassword ?? "");
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  } else if (input.newPassword === input.currentPassword) {
    errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu mới.";
  } else if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "Mật khẩu nhập lại không khớp.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
