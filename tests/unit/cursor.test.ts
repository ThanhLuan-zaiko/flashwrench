import { describe, expect, test } from "bun:test";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";

const SCOPE = "customer-bookings:user-1";

function tamper(cursor: string, index: number): string {
  const chars = cursor.split("");
  chars[index] = chars[index] === "a" ? "b" : "a";
  return chars.join("");
}

describe("encodeCursor/decodeCursor", () => {
  test("round-trips a signed cursor for the same scope", () => {
    const cursor = encodeCursor("state-abc", SCOPE);
    expect(cursor).not.toBeNull();
    expect(decodeCursor(cursor, SCOPE)).toBe("state-abc");
  });

  test("returns null for empty state and null/undefined input", () => {
    expect(encodeCursor(null, SCOPE)).toBeNull();
    expect(encodeCursor("", SCOPE)).toBeNull();
    expect(decodeCursor(null, SCOPE)).toBeNull();
    expect(decodeCursor(undefined, SCOPE)).toBeNull();
  });

  test("rejects a tampered payload and a tampered signature", () => {
    const cursor = encodeCursor("state-abc", SCOPE);
    if (!cursor) throw new Error("cursor expected");
    const [payload, signature] = cursor.split(".");
    expect(() => decodeCursor(tamper(cursor, 2), SCOPE)).toThrow();
    expect(() =>
      decodeCursor(`${payload}.${tamper(signature, 0)}`, SCOPE),
    ).toThrow();
  });

  test("rejects a cursor minted for another scope (owner/status)", () => {
    const cursor = encodeCursor("state-abc", SCOPE);
    expect(() => decodeCursor(cursor, "customer-bookings:user-2")).toThrow();
    expect(() => decodeCursor(cursor, "dispatch:u:pending:2026-09")).toThrow();
  });

  test("rejects malformed cursors", () => {
    for (const bad of [
      "",
      "plain",
      "a.b.c",
      ".",
      "a.",
      ".b",
      `${Buffer.from("not-json").toString("base64url")}.sig`,
    ]) {
      expect(() => decodeCursor(bad, SCOPE)).toThrow();
    }
  });

  test("rejects forged payloads that parse but fail the signature", () => {
    const forged = `${Buffer.from(
      JSON.stringify({ v: 1, scope: SCOPE, state: "evil" }),
    ).toString("base64url")}.${"x".repeat(43)}`;
    expect(() => decodeCursor(forged, SCOPE)).toThrow();
  });

  test("rejects oversized cursors", () => {
    const huge = `${"a".repeat(9000)}.${"b".repeat(43)}`;
    expect(() => decodeCursor(huge, SCOPE)).toThrow();
  });
});
