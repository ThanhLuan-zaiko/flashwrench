import { createHash, randomBytes, randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const ACCESS_COOKIE = "fw_at";
export const REFRESH_COOKIE = "fw_rt";
export const LEGACY_COOKIE = "fw_session";

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
export const REFRESH_REUSE_GRACE_SECONDS = 60;

const ISSUER = "flashwrench";
const AUDIENCE = "flashwrench-web";

type SigningKey = { kid: string; secret: Uint8Array };

function requireSecret(
  value: string | undefined,
  name: string,
): Uint8Array | null {
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing or too short ${name} (min 32 chars).`);
  }
  if (value) return new TextEncoder().encode(value);
  return null;
}

function getSigningKeys(): SigningKey[] {
  const current =
    requireSecret(process.env.AUTH_SECRET, "AUTH_SECRET") ??
    new TextEncoder().encode("dev-only-insecure-secret-change-me-000");
  const keys: SigningKey[] = [{ kid: "k1", secret: current }];
  const previous = process.env.AUTH_SECRET_PREVIOUS;
  if (previous) {
    keys.push({ kid: "k0", secret: new TextEncoder().encode(previous) });
  }
  return keys;
}

export type AccessClaims = { userId: string; tokenVersion: number };

export async function signAccessToken(
  userId: string,
  tokenVersion: number,
): Promise<string> {
  const [current] = getSigningKeys();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: "HS256", kid: current.kid, typ: "JWT" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TTL_SECONDS)
    .sign(current.secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessClaims | null> {
  for (const key of getSigningKeys()) {
    try {
      const { payload } = await jwtVerify(token, key.secret, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ["HS256"],
      });
      if (typeof payload.sub !== "string" || !payload.sub) return null;
      if (typeof payload.tv !== "number" || !Number.isInteger(payload.tv))
        return null;
      return { userId: payload.sub, tokenVersion: payload.tv };
    } catch {}
  }
  return null;
}

export type NewRefreshToken = { token: string; familyId: string; hash: string };

export function createRefreshToken(
  userId: string,
  familyId?: string,
): NewRefreshToken {
  const fid = familyId ?? randomUUID();
  const payload = Buffer.from(
    JSON.stringify({ v: 1, u: userId, f: fid }),
    "utf8",
  ).toString("base64url");
  const secret = randomBytes(32).toString("base64url");
  const token = `fw1.${payload}.${secret}`;
  return { token, familyId: fid, hash: hashToken(token) };
}

export function parseRefreshToken(
  raw: string,
): { userId: string; familyId: string } | null {
  try {
    const parts = raw.split(".");
    if (parts.length !== 3 || parts[0] !== "fw1") return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as unknown;
    if (typeof payload !== "object" || payload === null) return null;
    const { v, u, f } = payload as { v?: unknown; u?: unknown; f?: unknown };
    if (v !== 1 || typeof u !== "string" || !u || typeof f !== "string" || !f)
      return null;
    return { userId: u, familyId: f };
  } catch {
    return null;
  }
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function accessCookieOptions() {
  return baseCookieOptions(ACCESS_TTL_SECONDS);
}

export function refreshCookieOptions() {
  return baseCookieOptions(REFRESH_TTL_SECONDS);
}

export function clearedCookieOptions() {
  return { ...baseCookieOptions(0), maxAge: 0 };
}
