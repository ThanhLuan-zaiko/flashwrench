import { afterEach, describe, expect, test } from "bun:test";
import {
  decryptTempPassword,
  encryptTempPassword,
  isTempCryptoConfigured,
  resetTempCryptoCache,
} from "@/lib/auth/staff-temp-crypto";

const TEST_SECRET = Buffer.from(new Array(32).fill(7)).toString("base64");
const OTHER_SECRET = Buffer.from(new Array(32).fill(9)).toString("base64");

afterEach(() => {
  delete process.env.STAFF_TEMP_SECRET;
  resetTempCryptoCache();
});

describe("staff-temp-crypto", () => {
  test("round-trips a temp password", async () => {
    process.env.STAFF_TEMP_SECRET = TEST_SECRET;
    const enc = await encryptTempPassword("Abc123XyZ9");
    expect(enc.startsWith("v1.")).toBe(true);
    expect(enc).not.toContain("Abc123XyZ9");
    await expect(decryptTempPassword(enc)).resolves.toBe("Abc123XyZ9");
  });

  test("ciphertexts differ per encryption", async () => {
    process.env.STAFF_TEMP_SECRET = TEST_SECRET;
    const first = await encryptTempPassword("Abc123XyZ9");
    const second = await encryptTempPassword("Abc123XyZ9");
    expect(first).not.toBe(second);
  });

  test("rejects tampered payloads and wrong secrets", async () => {
    process.env.STAFF_TEMP_SECRET = TEST_SECRET;
    const enc = await encryptTempPassword("Abc123XyZ9");
    const tampered = `${enc.slice(0, -1)}${enc.endsWith("A") ? "B" : "A"}`;
    await expect(decryptTempPassword(tampered)).rejects.toThrow();
    await expect(decryptTempPassword("bad-format")).rejects.toThrow();
    process.env.STAFF_TEMP_SECRET = OTHER_SECRET;
    resetTempCryptoCache();
    await expect(decryptTempPassword(enc)).rejects.toThrow();
  });

  test("requires a configured 32-byte secret", async () => {
    delete process.env.STAFF_TEMP_SECRET;
    resetTempCryptoCache();
    await expect(encryptTempPassword("Abc123XyZ9")).rejects.toThrow();
    process.env.STAFF_TEMP_SECRET = "short";
    resetTempCryptoCache();
    await expect(encryptTempPassword("Abc123XyZ9")).rejects.toThrow();
  });

  test("reports configuration without throwing", () => {
    delete process.env.STAFF_TEMP_SECRET;
    expect(isTempCryptoConfigured()).toBe(false);
    process.env.STAFF_TEMP_SECRET = "short";
    expect(isTempCryptoConfigured()).toBe(false);
    process.env.STAFF_TEMP_SECRET = TEST_SECRET;
    expect(isTempCryptoConfigured()).toBe(true);
  });
});
