import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "dev-only-insecure-secret-change-me-000";
const MAX_CURSOR_LENGTH = 8192;

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing AUTH_SECRET.");
  }
  return DEV_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function encodeCursor(
  state: string | null,
  scope: string,
): string | null {
  if (!state) return null;
  const payload = toBase64Url(JSON.stringify({ v: 1, scope, state }));
  return `${payload}.${sign(payload)}`;
}

export function decodeCursor(
  cursor: string | null | undefined,
  scope: string,
): string | null {
  if (cursor === null || cursor === undefined) return null;
  if (cursor.length === 0 || cursor.length > MAX_CURSOR_LENGTH) {
    throw new Error("Invalid cursor.");
  }
  const [payload, signature, extra] = cursor.split(".");
  if (!payload || !signature || extra !== undefined) {
    throw new Error("Invalid cursor.");
  }
  const expected = sign(payload);
  const givenBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    givenBuf.length !== expectedBuf.length ||
    !timingSafeEqual(givenBuf, expectedBuf)
  ) {
    throw new Error("Invalid cursor.");
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid cursor.");
  }
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    (body as { v?: unknown }).v !== 1 ||
    (body as { scope?: unknown }).scope !== scope ||
    typeof (body as { state?: unknown }).state !== "string" ||
    (body as { state: string }).state.length === 0
  ) {
    throw new Error("Invalid cursor.");
  }
  return (body as { state: string }).state;
}
