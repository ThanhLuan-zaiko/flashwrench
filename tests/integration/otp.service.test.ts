import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  mailConfigMocks,
  mailerMocks,
  otpRepoMocks,
  otpStubs,
  resetOtpMocks,
} from "../helpers/guest-access.mocks";

// Helpers first, mocks second, system under test last. The repository and
// the mailer are both faked: no SMTP, no ScyllaDB.
mock.module("@/lib/otp/otp.repository", () => otpRepoMocks);
mock.module("@/lib/mail/mailer.service", () => mailerMocks);
mock.module("@/lib/mail/mail.config", () => mailConfigMocks);

import { requestEmailOtp, verifyEmailOtp } from "@/lib/otp/otp.service";
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from "@/lib/otp/otp.types";
import { hashOtp } from "@/lib/otp/otp-code";

const EMAIL = "an@example.com";
const PURPOSE = "guest_access";

/**
 * The code the service just mailed. The template puts it in the subject for
 * notification visibility, so the stubbed mail is enough to recover it —
 * no need to brute-force the stored hash.
 */
function lastMailedCode(): string {
  const sent = otpStubs.sent[otpStubs.sent.length - 1];
  const match = /(\d{6})/.exec(sent?.subject ?? "");
  if (!match) throw new Error("no mailed code found");
  return match[1];
}

beforeEach(() => {
  resetOtpMocks();
});

describe("requestEmailOtp", () => {
  test("stores a hashed code and mails the plaintext", async () => {
    const result = await requestEmailOtp({
      email: "  AN@Example.com ",
      purpose: PURPOSE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe(EMAIL);
    expect(result.data.expiresInSeconds).toBe(OTP_TTL_SECONDS);

    // The row carries a hash, never the code.
    expect(otpStubs.writes).toHaveLength(1);
    expect(otpStubs.writes[0].email).toBe(EMAIL);
    expect(otpStubs.writes[0].codeHash).toBe(
      hashOtp(EMAIL, PURPOSE, lastMailedCode()),
    );
    expect(otpStubs.writes[0].codeHash).not.toContain(lastMailedCode());
    expect(otpStubs.writes[0].ttlSeconds).toBe(OTP_TTL_SECONDS);
    expect(otpStubs.sent).toHaveLength(1);
    expect(otpStubs.sent[0].to).toBe(EMAIL);
  });

  test("expires the row five minutes out", async () => {
    const before = Date.now();
    await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });
    const expires = otpStubs.writes[0].expiresAt.getTime();
    expect(expires).toBeGreaterThanOrEqual(
      before + OTP_TTL_SECONDS * 1000 - 2000,
    );
    expect(expires).toBeLessThanOrEqual(
      Date.now() + OTP_TTL_SECONDS * 1000 + 2000,
    );
  });

  test("rejects a bad address without writing or mailing anything", async () => {
    const result = await requestEmailOtp({ email: "nope", purpose: PURPOSE });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(otpStubs.writes).toHaveLength(0);
    expect(otpStubs.sent).toHaveLength(0);
  });

  test("rejects an unknown purpose", async () => {
    const result = await requestEmailOtp({
      email: EMAIL,
      purpose: "password_reset",
    });
    expect(result.ok).toBe(false);
    expect(otpStubs.writes).toHaveLength(0);
  });

  // 503 rather than a silent success: telling someone to check an inbox that
  // can never receive anything is worse than an honest outage.
  test("fails loudly when the mail transport is not configured", async () => {
    otpStubs.mailConfigured = false;
    const result = await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(503);
    expect(otpStubs.writes).toHaveLength(0);
  });

  test("rolls the code back when delivery fails, so nothing is stranded", async () => {
    otpStubs.mailError = new Error("smtp down");
    const result = await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(502);
    expect(otpStubs.deletes).toHaveLength(1);
    expect(otpStubs.rows.size).toBe(0);
  });

  test("suppresses a resend inside the cooldown and re-mails after it", async () => {
    await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });
    expect(otpStubs.sent).toHaveLength(1);

    // Cooldown path: still a success shape, but nothing is re-mailed.
    const row = otpStubs.rows.get(`${EMAIL}|${PURPOSE}`);
    if (row?.created_at) {
      row.created_at = new Date(
        row.created_at.getTime() - (OTP_RESEND_COOLDOWN_SECONDS - 5) * 1000,
      );
    }
    const cooled = await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });
    expect(cooled.ok).toBe(true);
    if (cooled.ok) {
      expect(cooled.data.resendAfterSeconds).toBe(5);
    }
    expect(otpStubs.sent).toHaveLength(1);

    // Past the cooldown: a fresh code replaces the old one in place.
    if (row?.created_at) {
      row.created_at = new Date(
        row.created_at.getTime() - (OTP_RESEND_COOLDOWN_SECONDS + 5) * 1000,
      );
    }
    const resent = await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });
    expect(resent.ok).toBe(true);
    expect(otpStubs.sent).toHaveLength(2);
    expect(otpStubs.rows.size).toBe(1);
  });
});

describe("verifyEmailOtp", () => {
  async function issue() {
    await requestEmailOtp({ email: EMAIL, purpose: PURPOSE });
    return lastMailedCode();
  }

  test("accepts the mailed code and consumes it", async () => {
    const code = await issue();
    const result = await verifyEmailOtp({
      email: EMAIL,
      code,
      purpose: PURPOSE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe(EMAIL);
    // Single use: the row is gone.
    expect(otpStubs.deletes).toHaveLength(1);
    expect(otpStubs.rows.size).toBe(0);
  });

  test("verifies a code that was pasted with spaces", async () => {
    const code = await issue();
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
    const result = await verifyEmailOtp({
      email: EMAIL,
      code: spaced,
      purpose: PURPOSE,
    });
    expect(result.ok).toBe(true);
  });

  test("rejects a wrong code and counts the attempt", async () => {
    await issue();
    const wrong = lastMailedCode() === "000000" ? "111111" : "000000";

    const result = await verifyEmailOtp({
      email: EMAIL,
      code: wrong,
      purpose: PURPOSE,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(otpStubs.attempts).toEqual([
      { email: EMAIL, purpose: PURPOSE, attempts: 1 },
    ]);
  });

  // Every rejection must look identical, otherwise the endpoint reveals
  // whether a live code exists for an address.
  test("returns one indistinguishable message for every failure mode", async () => {
    const noRow = await verifyEmailOtp({
      email: EMAIL,
      code: "111111",
      purpose: PURPOSE,
    });
    expect(noRow.ok).toBe(false);
    if (noRow.ok) return;
    const generic = JSON.stringify(noRow.errors);

    const code = await issue();
    const wrong = code === "000000" ? "111111" : "000000";
    const wrongResult = await verifyEmailOtp({
      email: EMAIL,
      code: wrong,
      purpose: PURPOSE,
    });
    expect(wrongResult.ok).toBe(false);
    if (wrongResult.ok) return;
    expect(JSON.stringify(wrongResult.errors)).toBe(generic);

    const row = otpStubs.rows.get(`${EMAIL}|${PURPOSE}`);
    if (row) row.expires_at = new Date(Date.now() - 1000);
    const expired = await verifyEmailOtp({
      email: EMAIL,
      code,
      purpose: PURPOSE,
    });
    expect(expired.ok).toBe(false);
    if (expired.ok) return;
    expect(JSON.stringify(expired.errors)).toBe(generic);
  });

  test("destroys an expired code instead of leaving it readable", async () => {
    await issue();
    const row = otpStubs.rows.get(`${EMAIL}|${PURPOSE}`);
    if (row) row.expires_at = new Date(Date.now() - 1);

    await verifyEmailOtp({ email: EMAIL, code: "111111", purpose: PURPOSE });
    expect(otpStubs.rows.size).toBe(0);
  });

  // Without burning the code at the limit, a patient attacker gets
  // unlimited tries across the whole validity window.
  test("burns the code once the attempt budget is spent", async () => {
    const code = await issue();
    const wrong = code === "000000" ? "111111" : "000000";
    for (let attempt = 0; attempt < OTP_MAX_ATTEMPTS; attempt += 1) {
      const isLast = attempt === OTP_MAX_ATTEMPTS - 1;
      const result = await verifyEmailOtp({
        email: EMAIL,
        code: isLast ? code : wrong,
        purpose: PURPOSE,
      });
      if (isLast) {
        expect(result.ok).toBe(true);
      } else {
        expect(result.ok).toBe(false);
      }
    }
    // The winning attempt spent the last guess, so the row is consumed.
    expect(otpStubs.rows.size).toBe(0);
  });

  test("refuses a code already over the budget", async () => {
    await issue();
    const row = otpStubs.rows.get(`${EMAIL}|${PURPOSE}`);
    if (row) row.attempts = OTP_MAX_ATTEMPTS;

    const result = await verifyEmailOtp({
      email: EMAIL,
      code: "111111",
      purpose: PURPOSE,
    });
    expect(result.ok).toBe(false);
    expect(otpStubs.rows.size).toBe(0);
  });

  test("rejects a malformed code before touching storage", async () => {
    await issue();
    const result = await verifyEmailOtp({
      email: EMAIL,
      code: "12",
      purpose: PURPOSE,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    // The live code survives a client-side formatting mistake.
    expect(otpStubs.rows.size).toBe(1);
    expect(otpStubs.attempts).toHaveLength(0);
  });
});
