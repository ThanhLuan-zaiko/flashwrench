// Shared stubs for the guest-access (OTP) suites: one in-memory email_otps
// row, a mailer spy, and the email-keyed guest record index. Tests drive
// `otpStubs` / `guestAccessStubs` and assert on `mock.calls`. Nothing
// touches SMTP or a real database.
import { mock } from "bun:test";
import type { PutGuestRecordRef } from "@/lib/guest-access/guest-access.repository";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import type { PutOtpWrite } from "@/lib/otp/otp.repository";
import type { OtpPurpose, OtpRow } from "@/lib/otp/otp.types";

type OtpKey = `${string}|${string}`;

function otpKey(email: string, purpose: OtpPurpose): OtpKey {
  return `${email}|${purpose}`;
}

export const otpStubs = {
  /** Rows keyed by email|purpose, mirroring the single-row partition. */
  rows: new Map<OtpKey, OtpRow>(),
  writes: [] as PutOtpWrite[],
  deletes: [] as OtpKey[],
  attempts: [] as { email: string; purpose: OtpPurpose; attempts: number }[],
  /** Simulated clock so cooldown and expiry are testable without waiting. */
  now: new Date("2026-01-01T00:00:00.000Z"),
  mailConfigured: true,
  mailError: null as Error | null,
  sent: [] as { to: string; subject: string; body: string }[],
};

export const otpRepoMocks = {
  putEmailOtp: mock(async (write: PutOtpWrite): Promise<void> => {
    otpStubs.writes.push(write);
    otpStubs.rows.set(otpKey(write.email, write.purpose), {
      code_hash: write.codeHash,
      attempts: 0,
      expires_at: write.expiresAt,
      created_at: write.createdAt,
    });
  }),
  findEmailOtp: mock(
    async (email: string, purpose: OtpPurpose): Promise<OtpRow | null> =>
      otpStubs.rows.get(otpKey(email, purpose)) ?? null,
  ),
  bumpEmailOtpAttempts: mock(
    async (
      email: string,
      purpose: OtpPurpose,
      attempts: number,
    ): Promise<void> => {
      otpStubs.attempts.push({ email, purpose, attempts });
      const row = otpStubs.rows.get(otpKey(email, purpose));
      if (row) row.attempts = attempts;
    },
  ),
  deleteEmailOtp: mock(
    async (email: string, purpose: OtpPurpose): Promise<void> => {
      otpStubs.deletes.push(otpKey(email, purpose));
      otpStubs.rows.delete(otpKey(email, purpose));
    },
  ),
};

export const mailConfigMocks = {
  isMailConfigured: mock((): boolean => otpStubs.mailConfigured),
};

export const mailerMocks = {
  sendMail: mock(
    async (message: {
      to: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<void> => {
      if (otpStubs.mailError) throw otpStubs.mailError;
      otpStubs.sent.push({
        to: message.to,
        subject: message.subject,
        body: message.text,
      });
    },
  ),
};

export const guestAccessStubs = {
  refs: [] as {
    record_type: GuestRecordType;
    record_id: string;
    created_at: Date | null;
    phone: string | null;
  }[],
  puts: [] as PutGuestRecordRef[],
  deletes: [] as string[],
};

export const guestAccessRepoMocks = {
  putGuestRecordRef: mock(async (write: PutGuestRecordRef): Promise<void> => {
    guestAccessStubs.puts.push(write);
  }),
  listGuestRecordRefsByEmail: mock(
    async (
      _email: string,
    ): Promise<
      {
        record_type: GuestRecordType;
        record_id: string;
        created_at: Date | null;
        phone: string | null;
      }[]
    > =>
      // Every stubbed ref belongs to the address the suite asks about; the
      // ownership tests drive the filtering through the row mocks instead.
      guestAccessStubs.refs.map((ref) => ({ ...ref })),
  ),
  deleteGuestRecordRef: mock(
    async (email: string, id: string): Promise<void> => {
      guestAccessStubs.deletes.push(`${email}:${id}`);
    },
  ),
};

export function resetOtpMocks(): void {
  otpStubs.rows.clear();
  otpStubs.writes = [];
  otpStubs.deletes = [];
  otpStubs.attempts = [];
  otpStubs.now = new Date("2026-01-01T00:00:00.000Z");
  otpStubs.mailConfigured = true;
  otpStubs.mailError = null;
  otpStubs.sent = [];
  for (const fn of Object.values(otpRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mailConfigMocks)) fn.mockClear();
  for (const fn of Object.values(mailerMocks)) fn.mockClear();
}

export function resetGuestAccessMocks(): void {
  guestAccessStubs.refs = [];
  guestAccessStubs.puts = [];
  guestAccessStubs.deletes = [];
  for (const fn of Object.values(guestAccessRepoMocks)) fn.mockClear();
}
