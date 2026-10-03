// Client-side sanitizer for the six-digit lookup code. Mirrors the server
// normalizer in lib/otp/otp.validation without importing server code.
export function sanitizeOtpInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

/** True when the code is ready to submit. */
export function isCompleteOtpCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}
