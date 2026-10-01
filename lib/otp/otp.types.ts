// Guest-access OTP vocabulary. A "purpose" scopes a code so a future
// email-verification or password-reset flow can reuse the same table and
// repository without colliding with lookups.
export const OTP_PURPOSES = ["guest_access"] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** How long a code stays usable. Also the TTL written on the row. */
export const OTP_TTL_SECONDS = 5 * 60;

/** Wrong guesses allowed before the code is destroyed. */
export const OTP_MAX_ATTEMPTS = 5;

/** Minimum gap between two sends to the same address. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** One generic message for every failure mode: no row, wrong code, expired
 *  or exhausted. Distinguishing them would tell an attacker whether a code
 *  is live. Vietnamese: user-facing. */
export const OTP_INVALID_MESSAGE = "Mã xác minh không đúng hoặc đã hết hạn.";

export const OTP_PURPOSE_LABELS: Record<OtpPurpose, string> = {
  guest_access: "xem lại lịch sử dịch vụ và hóa đơn của bạn",
};

export function isOtpPurpose(value: unknown): value is OtpPurpose {
  return (
    typeof value === "string" &&
    (OTP_PURPOSES as readonly string[]).includes(value)
  );
}

export type OtpRow = {
  code_hash: string | null;
  attempts: number | null;
  expires_at: Date | null;
  created_at: Date | null;
};

export type OtpRequestResult =
  | {
      ok: true;
      data: {
        email: string;
        maskedEmail: string;
        expiresInSeconds: number;
        resendAfterSeconds: number;
      };
    }
  | { ok: false; status: number; errors: { form: string } };

export type OtpVerifyResult =
  | { ok: true; data: { email: string } }
  | { ok: false; status: number; errors: { code?: string; form?: string } };
