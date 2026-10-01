// OTP orchestration: issue, deliver, verify. Rate limiting and the CSRF
// origin check live in the route handler (enforceRequestGuards); this layer
// owns the resend cooldown, the attempt budget and the single generic
// failure message.

import { isMailConfigured } from "@/lib/mail/mail.config";
import { sendMail } from "@/lib/mail/mailer.service";
import { buildOtpEmail, maskEmail } from "@/lib/mail/otp-email";
import {
  bumpEmailOtpAttempts,
  deleteEmailOtp,
  findEmailOtp,
  putEmailOtp,
} from "./otp.repository";
import {
  OTP_INVALID_MESSAGE,
  OTP_MAX_ATTEMPTS,
  OTP_PURPOSE_LABELS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  type OtpRequestResult,
  type OtpVerifyResult,
} from "./otp.types";
import {
  normalizeOtpTarget,
  type OtpRequestInput,
  type OtpVerifyInput,
  validateOtpVerifyInput,
} from "./otp.validation";
import { hashOtp, newOtpCode, verifyOtpHash } from "./otp-code";

function isValidDate(value: Date | null): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Issues a code and mails it. The response is deliberately uniform: an
 * unknown address looks exactly like a known one, so the endpoint cannot be
 * used to test whether someone has an account or a booking here.
 */
export async function requestEmailOtp(
  raw: OtpRequestInput,
): Promise<OtpRequestResult> {
  const target = normalizeOtpTarget(raw);
  if ("errors" in target) {
    return {
      ok: false,
      status: 400,
      errors: { form: target.errors.email ?? target.errors.form ?? "" },
    };
  }
  const { email, purpose } = target.value;

  // Fail loudly rather than silently: with no transport the visitor would be
  // told to check an inbox that can never receive anything.
  if (!isMailConfigured()) {
    return {
      ok: false,
      status: 503,
      errors: {
        form: "Tính năng xác minh qua email tạm thời không khả dụng. Vui lòng thử lại sau.",
      },
    };
  }

  const now = new Date();
  const maskedEmail = maskEmail(email);

  // Cooldown guards the inbox against mail bombing. The visitor still gets a
  // success shape, just told when they can ask again.
  const existing = await findEmailOtp(email, purpose);
  if (existing && isValidDate(existing.created_at)) {
    const elapsed = Math.floor(
      (now.getTime() - existing.created_at.getTime()) / 1000,
    );
    const remaining = OTP_RESEND_COOLDOWN_SECONDS - elapsed;
    if (remaining > 0) {
      return {
        ok: true,
        data: {
          email,
          maskedEmail,
          expiresInSeconds: OTP_TTL_SECONDS,
          resendAfterSeconds: remaining,
        },
      };
    }
  }

  const code = newOtpCode();
  await putEmailOtp({
    email,
    purpose,
    codeHash: hashOtp(email, purpose, code),
    expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    createdAt: now,
    ttlSeconds: OTP_TTL_SECONDS,
  });

  try {
    const content = buildOtpEmail(email, code, OTP_PURPOSE_LABELS[purpose]);
    await sendMail({ to: email, ...content });
  } catch (error) {
    // Roll the row back: a code nobody received must not stay valid, and
    // leaving it would make the next attempt look like it is in cooldown.
    await deleteEmailOtp(email, purpose).catch(() => undefined);
    console.error("[otp] delivery failed", error);
    return {
      ok: false,
      status: 502,
      errors: { form: "Không gửi được mã xác minh. Vui lòng thử lại sau." },
    };
  }

  return {
    ok: true,
    data: {
      email,
      maskedEmail,
      expiresInSeconds: OTP_TTL_SECONDS,
      resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    },
  };
}

/**
 * Consumes a code and hands back the verified address. Every rejection path
 * returns the same 400 with the same message, so the endpoint reveals nothing
 * about whether a row exists, expired or was already spent.
 */
export async function verifyEmailOtp(
  raw: OtpVerifyInput,
): Promise<OtpVerifyResult> {
  const checked = validateOtpVerifyInput(raw);
  if ("errors" in checked) {
    return {
      ok: false,
      status: 400,
      errors: {
        code: checked.errors.code,
        form: checked.errors.email ?? checked.errors.form,
      },
    };
  }
  const { email, purpose, code } = checked.value;

  const row = await findEmailOtp(email, purpose);
  if (!row?.code_hash) {
    return { ok: false, status: 400, errors: { code: OTP_INVALID_MESSAGE } };
  }

  if (!isValidDate(row.expires_at) || row.expires_at.getTime() <= Date.now()) {
    await deleteEmailOtp(email, purpose).catch(() => undefined);
    return { ok: false, status: 400, errors: { code: OTP_INVALID_MESSAGE } };
  }

  const attempts = row.attempts ?? 0;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await deleteEmailOtp(email, purpose).catch(() => undefined);
    return { ok: false, status: 400, errors: { code: OTP_INVALID_MESSAGE } };
  }

  if (!verifyOtpHash(email, purpose, code, row.code_hash)) {
    const next = attempts + 1;
    if (next >= OTP_MAX_ATTEMPTS) {
      // Burn the code at the budget limit: otherwise a patient attacker gets
      // unlimited tries across the whole validity window.
      await deleteEmailOtp(email, purpose).catch(() => undefined);
    } else {
      await bumpEmailOtpAttempts(email, purpose, next).catch(() => undefined);
    }
    return { ok: false, status: 400, errors: { code: OTP_INVALID_MESSAGE } };
  }

  await deleteEmailOtp(email, purpose).catch(() => undefined);
  return { ok: true, data: { email } };
}
