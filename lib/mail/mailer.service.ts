// Nodemailer SMTP transport. Provider-agnostic on purpose: the same code
// works against Gmail (App Password), Resend, Brevo, Mailtrap or a
// corporate relay — only MAIL_* env values change.
//
// nodemailer is loaded lazily so the ~20 transitive modules stay out of any
// bundle that merely imports this file, and so tests can run without SMTP.
import type { Transporter } from "nodemailer";
import { readMailConfig } from "./mail.config";
import type { MailMessage } from "./mailer.types";

export class MailNotConfiguredError extends Error {
  constructor() {
    super("Mail transport is not configured (MAIL_HOST / MAIL_FROM missing).");
    this.name = "MailNotConfiguredError";
  }
}

export class MailDeliveryError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "MailDeliveryError";
  }
}

let transporterPromise: Promise<Transporter> | null = null;

async function createTransporter(): Promise<Transporter> {
  const config = readMailConfig();
  if (!config) throw new MailNotConfiguredError();

  // Dynamic import keeps nodemailer server-side and out of the module graph
  // of anything that only needs the config reader.
  const nodemailer = (await import("nodemailer")).default;
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? { user: config.user, pass: config.pass ?? "" }
      : undefined,
    pool: true,
    connectionTimeout: config.connectionTimeoutMs,
    socketTimeout: config.socketTimeoutMs,
  });
}

async function getTransporter(): Promise<Transporter> {
  // Reuse one pooled transport per process. A failed connect is not cached,
  // so a later request can recover once the provider is back.
  transporterPromise ??= createTransporter().catch((error) => {
    transporterPromise = null;
    throw error;
  });
  return transporterPromise;
}

// Test seam: drops the cached transport so a suite can swap env values.
export function resetMailTransport(): void {
  transporterPromise = null;
}

// Throws on failure by design. Callers decide what an undeliverable message
// means for their flow (the OTP service deletes the code it cannot send
// rather than stranding the visitor on a code that never arrives).
export async function sendMail(message: MailMessage): Promise<void> {
  const config = readMailConfig();
  if (!config) throw new MailNotConfiguredError();

  const transporter = await getTransporter();
  try {
    await transporter.sendMail({
      from: { name: config.fromName, address: config.from },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    throw new MailDeliveryError(
      error instanceof Error ? error.message : String(error),
    );
  }
}
