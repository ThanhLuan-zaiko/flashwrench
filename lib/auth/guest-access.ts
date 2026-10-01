// Read-only "guest access" session.
//
// A visitor who proves control of an email address gets a signed cookie that
// names the address and nothing else. No user row is created, no password
// exists, and the cookie grants no write access anywhere in the app — it
// only unlocks listing and reading that address's own anonymous records.
//
// Stateless by design: the cookie carries its own expiry and is verified by
// signature alone, so there is no session table to clean up. Kept separate
// from fw_at / fw_rt so signing in or out never disturbs it, and so it can
// never be mistaken for a real session.
import { createHmac, timingSafeEqual } from "node:crypto";

export const GUEST_ACCESS_COOKIE = "fw_gx";
export const GUEST_ACCESS_TTL_SECONDS = 7 * 24 * 60 * 60;

const PREFIX = "fwg1";

type GuestAccessClaims = {
  /** Verified email address — the only identity claim. */
  e: string;
  /** Expiry, seconds since epoch. */
  x: number;
};

function secret(): string {
  return (
    process.env.AUTH_SECRET?.trim() || "dev-only-insecure-secret-change-me-000"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret())
    .update(payload, "utf8")
    .digest("base64url");
}

export function createGuestAccessToken(
  email: string,
  now = new Date(),
): string {
  const claims: GuestAccessClaims = {
    e: email,
    x: Math.floor(now.getTime() / 1000) + GUEST_ACCESS_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url",
  );
  return `${PREFIX}.${payload}.${sign(payload)}`;
}

export function parseGuestAccessToken(
  raw: string | undefined,
  now = new Date(),
): { email: string } | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;

  const [, payload, signature] = parts;
  const expected = Buffer.from(sign(payload), "utf8");
  const actual = Buffer.from(signature, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  let claims: GuestAccessClaims;
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof decoded !== "object" || decoded === null) return null;
    const { e, x } = decoded as { e?: unknown; x?: unknown };
    if (typeof e !== "string" || !e) return null;
    if (typeof x !== "number" || !Number.isFinite(x)) return null;
    claims = { e, x };
  } catch {
    return null;
  }

  if (claims.x * 1000 <= now.getTime()) return null;
  return { email: claims.e };
}

export function guestAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_ACCESS_TTL_SECONDS,
  };
}

export function clearedGuestAccessCookieOptions() {
  return { ...guestAccessCookieOptions(), maxAge: 0 };
}
