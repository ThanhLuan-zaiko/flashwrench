// SMTP configuration read from the environment. Kept separate from the
// transport so the OTP service can ask "is mail even set up?" before it
// writes a code nobody will be able to receive.

export type MailConfig = {
  host: string;
  port: number;
  /** Implicit TLS (port 465) vs STARTTLS (587). */
  secure: boolean;
  user: string | null;
  pass: string | null;
  from: string;
  fromName: string;
  /** Fail fast instead of hanging when the SMTP host is unreachable. */
  connectionTimeoutMs: number;
  socketTimeoutMs: number;
};

function trimmed(value: string | undefined): string | null {
  if (!value) return null;
  const out = value.trim();
  return out ? out : null;
}

function numberOr(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readMailConfig(): MailConfig | null {
  const host = trimmed(process.env.MAIL_HOST);
  const from = trimmed(process.env.MAIL_FROM);
  // A transport without a sender address is useless: every provider rejects
  // a message with an empty envelope. Treat it as "mail not configured" so
  // the caller fails loudly instead of silently dropping verification codes.
  if (!host || !from) return null;

  const port = numberOr(process.env.MAIL_PORT, 587);
  return {
    host,
    port,
    // 465 is implicit TLS; everything else falls back to STARTTLS.
    secure: trimmed(process.env.MAIL_SECURE) === "true" || port === 465,
    user: trimmed(process.env.MAIL_USER),
    pass: trimmed(process.env.MAIL_PASS),
    from,
    fromName: trimmed(process.env.MAIL_FROM_NAME) ?? "FlashWrench",
    connectionTimeoutMs: numberOr(process.env.MAIL_TIMEOUT_MS, 10_000),
    socketTimeoutMs: numberOr(process.env.MAIL_TIMEOUT_MS, 20_000),
  };
}

export function isMailConfigured(): boolean {
  return readMailConfig() !== null;
}
