// Opt-out links are signed per customer: a token only opens its own account
// and stops working when tampered with or signed with another secret.
import { describe, expect, test } from "bun:test";
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/vehicles/maintenance-unsubscribe-token";

const USER = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";

describe("unsubscribe token", () => {
  test("verifies for its own user and secret", () => {
    const token = unsubscribeToken(USER, "secret-a");
    expect(verifyUnsubscribeToken(USER, token, "secret-a")).toBe(true);
  });

  test("does not open another customer's account", () => {
    const token = unsubscribeToken(USER, "secret-a");
    expect(verifyUnsubscribeToken(OTHER, token, "secret-a")).toBe(false);
  });

  test("rejects a different secret and a tampered token", () => {
    const token = unsubscribeToken(USER, "secret-a");
    expect(verifyUnsubscribeToken(USER, token, "secret-b")).toBe(false);
    expect(
      verifyUnsubscribeToken(USER, `${token.slice(0, -1)}0`, "secret-a"),
    ).toBe(false);
    expect(verifyUnsubscribeToken(USER, "", "secret-a")).toBe(false);
  });
});
