// Startup preflight for the mail channel. Prints the egress public IP and
// probes SMTP auth, so `bun run dev:all` / `bun run start:all` logs spell out
// exactly what to fix (whitelist the IP, rotate the key, ...) instead of a
// raw nodemailer error surfacing inside an OTP request.
//
// Never fails startup: without mail the OTP endpoints simply answer 503.
// Standalone usage: `bun run check:mail`.
import nodemailer from "nodemailer";
import { readMailConfig } from "../lib/mail/mail.config";

const TAG = "[mail]";

async function publicIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org", {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const ip = (await res.text()).trim();
    return ip || null;
  } catch {
    return null;
  }
}

// Maps common nodemailer/SMTP failures to the concrete operator action.
function hintFor(raw: string, ip: string | null): string {
  const msg = raw.toLowerCase();
  if (msg.includes("unauthorized ip") || msg.includes("525")) {
    return `provider blocks unlisted egress IPs -> add ${ip ?? "your public IP"} to the account's Authorized IPs (Brevo: SMTP & API -> Security)`;
  }
  if (
    msg.includes("invalid login") ||
    msg.includes("535") ||
    msg.includes("authentication")
  ) {
    return "SMTP auth rejected -> check MAIL_USER / MAIL_PASS (Brevo: generate a fresh key under SMTP & API -> SMTP)";
  }
  if (
    msg.includes("enotfound") ||
    msg.includes("eai_again") ||
    msg.includes("getaddrinfo")
  ) {
    return "DNS cannot resolve MAIL_HOST -> check the hostname spelling";
  }
  if (
    msg.includes("timed out") ||
    msg.includes("etimedout") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset")
  ) {
    return "cannot reach the SMTP port -> check MAIL_PORT / MAIL_SECURE (587+STARTTLS or 465+TLS) and that outbound SMTP is allowed";
  }
  if (msg.includes("certificate") || msg.includes("self-signed")) {
    return "TLS certificate problem -> check MAIL_SECURE matches MAIL_PORT";
  }
  return "see the raw error above";
}

export async function reportMailStatus(): Promise<void> {
  const config = readMailConfig();
  if (!config) {
    console.log(
      `${TAG} MAIL_HOST/MAIL_FROM not set -> OTP mail disabled (API answers 503). Skipping check.`,
    );
    return;
  }

  const ip = await publicIp();
  console.log(`${TAG} public IP: ${ip ?? "<unavailable>"}`);

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? { user: config.user, pass: config.pass ?? "" }
      : undefined,
    pool: false,
    connectionTimeout: config.connectionTimeoutMs,
    socketTimeout: config.socketTimeoutMs,
  });

  try {
    await transport.verify();
    console.log(
      `${TAG} ${config.host}:${config.port} (${config.secure ? "TLS" : "STARTTLS"}) user ${config.user ?? "<none>"} -> AUTH OK`,
    );
    console.log(
      `${TAG} note: MAIL_FROM (${config.from}) must be a verified sender at the provider or sends get rejected`,
    );
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    console.log(`${TAG} FAIL ${config.host}:${config.port} -> ${raw}`);
    console.log(`${TAG} hint: ${hintFor(raw, ip)}`);
  } finally {
    transport.close();
  }
}

if (import.meta.main) await reportMailStatus();
