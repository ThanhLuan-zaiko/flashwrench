import { describe, expect, test } from "bun:test";
import {
  buildBookingHref,
  buildLoginHref,
  buildRegisterHref,
  defaultPostAuthHref,
  getSafeNextPath,
  resolvePostAuthHref,
} from "@/lib/auth/auth-redirect";

// Pure redirect guards behind the /services booking loop fix: guests keep
// their booking intent in `?next=`, logged-in users never bounce back to
// an auth page. No React, no mocks.

describe("getSafeNextPath", () => {
  test("accepts internal booking and service targets", () => {
    expect(getSafeNextPath("/booking")).toBe("/booking");
    expect(getSafeNextPath("/booking?serviceId=abc-123")).toBe(
      "/booking?serviceId=abc-123",
    );
    expect(getSafeNextPath("/services")).toBe("/services");
    expect(getSafeNextPath("/")).toBe("/");
  });

  test("rejects empty and missing values", () => {
    expect(getSafeNextPath(null)).toBeNull();
    expect(getSafeNextPath(undefined)).toBeNull();
    expect(getSafeNextPath("")).toBeNull();
    expect(getSafeNextPath("   ")).toBeNull();
  });

  test("rejects external and protocol-trick targets", () => {
    expect(getSafeNextPath("https://evil.test/booking")).toBeNull();
    expect(getSafeNextPath("//evil.test/booking")).toBeNull();
    expect(getSafeNextPath("javascript:alert(1)")).toBeNull();
    expect(getSafeNextPath("/booking?x=javascript:alert")).toBe(
      "/booking?x=javascript:alert",
    );
    expect(getSafeNextPath("booking")).toBeNull();
    expect(getSafeNextPath("/\\evil")).toBeNull();
  });

  test("rejects auth and api loops", () => {
    expect(getSafeNextPath("/login")).toBeNull();
    expect(getSafeNextPath("/login?next=/booking")).toBeNull();
    expect(getSafeNextPath("/register")).toBeNull();
    expect(getSafeNextPath("/register?next=/")).toBeNull();
    expect(getSafeNextPath("/api/auth/me")).toBeNull();
  });

  test("rejects overlong values", () => {
    expect(getSafeNextPath(`/${"a".repeat(600)}`)).toBeNull();
  });
});

describe("resolvePostAuthHref", () => {
  test("prefers the safe next target over role defaults", () => {
    expect(resolvePostAuthHref("customer", "/booking?serviceId=s1")).toBe(
      "/booking?serviceId=s1",
    );
    expect(resolvePostAuthHref("admin", "/booking")).toBe("/booking");
  });

  test("falls back per role when next is missing or unsafe", () => {
    expect(defaultPostAuthHref("customer")).toBe("/");
    expect(defaultPostAuthHref("admin")).toBe("/admin");
    expect(resolvePostAuthHref("customer", null)).toBe("/");
    expect(resolvePostAuthHref("admin", null)).toBe("/admin");
    expect(resolvePostAuthHref("customer", "https://evil.test")).toBe("/");
    expect(resolvePostAuthHref("customer", "/login")).toBe("/");
  });
});

describe("auth href builders", () => {
  test("preserves a safe booking target in login and register links", () => {
    expect(buildLoginHref("/booking?serviceId=s1")).toBe(
      "/login?next=%2Fbooking%3FserviceId%3Ds1",
    );
    expect(buildRegisterHref("/services")).toBe("/register?next=%2Fservices");
  });

  test("drops unsafe targets instead of creating open redirects", () => {
    expect(buildLoginHref("https://evil.test")).toBe("/login");
    expect(buildLoginHref("/login")).toBe("/login");
    expect(buildRegisterHref(null)).toBe("/register");
  });

  test("builds booking links with and without a service", () => {
    expect(buildBookingHref()).toBe("/booking");
    expect(buildBookingHref("  ")).toBe("/booking");
    expect(buildBookingHref("service-1")).toBe("/booking?serviceId=service-1");
    expect(buildBookingHref("a/b")).toBe("/booking");
  });
});
