import { describe, expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

// The only test that runs the real Argon2id hasher. Service suites stub
// `password.ts` for speed; this file proves the real primitive behaves.
describe("password hashing", () => {
  test("hashes and verifies the same password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  test("rejects wrong passwords and non-argon hashes", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrongpass1", hash)).toBe(false);
    expect(await verifyPassword("secret123", "bcrypt-hash")).toBe(false);
    expect(await verifyPassword("secret123", "")).toBe(false);
  });
});
