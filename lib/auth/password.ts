import { randomBytes } from "node:crypto";
import { argon2id, argon2Verify } from "hash-wasm";

// OWASP parameters for Argon2id (memorySize is in KiB).
const ARGON2_ITERATIONS = 2;
const ARGON2_MEMORY_KIB = 19_456;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_BYTES = 32;

export async function hashPassword(password: string): Promise<string> {
  return argon2id({
    password,
    salt: randomBytes(16),
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_KIB,
    hashLength: ARGON2_HASH_BYTES,
    outputType: "encoded",
  });
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    if (!stored.startsWith("$argon2id$")) return false;
    return await argon2Verify({ password, hash: stored });
  } catch {
    return false;
  }
}
