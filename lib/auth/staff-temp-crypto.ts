// Reversible encryption for staff temp passwords. The plain password must
// stay viewable until the staff member changes it, so it is stored AES-GCM
// encrypted and deleted on password change or hard delete. Only admins can
// decrypt through the pending-passwords endpoint; the wire format never
// leaves the server except over that authenticated HTTPS route.

const PREFIX = "v1";
const IV_BYTES = 12;

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function bytesToBase64(value: Uint8Array<ArrayBuffer>): string {
  return Buffer.from(value.buffer as ArrayBuffer).toString("base64");
}

// Secret is a 32-byte raw key encoded as base64 in STAFF_TEMP_SECRET.
// Cached after the first import so every encrypt/decrypt shares one key.
let cachedKey: CryptoKey | null = null;
let cachedSecret: string | null = null;

export function resetTempCryptoCache(): void {
  cachedKey = null;
  cachedSecret = null;
}

// Reports whether temp passwords can be persisted without throwing.
// The admin UI uses this to explain an empty list instead of hiding a
// missing STAFF_TEMP_SECRET configuration failure.
export function isTempCryptoConfigured(): boolean {
  const secret = process.env.STAFF_TEMP_SECRET ?? "";
  if (!secret) return false;
  try {
    return base64ToBytes(secret).length === 32;
  } catch {
    return false;
  }
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.STAFF_TEMP_SECRET ?? "";
  if (!secret) throw new Error("STAFF_TEMP_SECRET is not configured.");
  if (cachedKey && cachedSecret === secret) return cachedKey;
  const raw = base64ToBytes(secret);
  if (raw.length !== 32) throw new Error("STAFF_TEMP_SECRET must be 32 bytes.");
  cachedKey = await crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
  cachedSecret = secret;
  return cachedKey;
}

export async function encryptTempPassword(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_BYTES)));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plain),
  );
  return `${PREFIX}.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`;
}

export async function decryptTempPassword(enc: string): Promise<string> {
  const key = await getKey();
  const parts = enc.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    throw new Error("Unknown temp password format.");
  }
  const iv = base64ToBytes(parts[1] ?? "");
  const data = base64ToBytes(parts[2] ?? "");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    data as BufferSource,
  );
  return new TextDecoder().decode(plain);
}
