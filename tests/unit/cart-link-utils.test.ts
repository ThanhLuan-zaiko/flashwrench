// Header cart link visibility: the icon stays mounted for guests,
// pending sessions and customers — only staff roles lose it, since the
// cart API is customer-only.
import { describe, expect, test } from "bun:test";
import { canSeeCartLink } from "@/components/layout/cart-link-utils";
import { makePublicUser } from "../helpers/auth.fixtures";

describe("canSeeCartLink", () => {
  test("guests and still-resolving sessions see the icon", () => {
    expect(canSeeCartLink(null)).toBe(true);
    expect(canSeeCartLink(undefined)).toBe(true);
  });

  test("customers see the icon", () => {
    expect(canSeeCartLink(makePublicUser({ role: "customer" }))).toBe(true);
  });

  test("staff roles do not", () => {
    for (const role of ["mechanic", "dispatcher", "admin"] as const) {
      expect(canSeeCartLink(makePublicUser({ role }))).toBe(false);
    }
  });
});
