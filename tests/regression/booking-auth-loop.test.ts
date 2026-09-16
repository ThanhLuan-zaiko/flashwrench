import { describe, expect, test } from "bun:test";
import {
  buildBookingHref,
  buildLoginHref,
  getSafeNextPath,
  resolvePostAuthHref,
} from "@/lib/auth/auth-redirect";

// Regression for the /services booking loop: a guest tap on "Dat dich vu"
// used to land on a static /register link with no intent preserved, so
// after signing in the user dropped on "/" and the next tap showed an auth
// form again. The fixed flow preserves the booking target in `?next=`.

describe("booking auth loop", () => {
  test("guest intent survives login and returns to the booked service", () => {
    const bookingHref = buildBookingHref("service-1");
    expect(bookingHref).toBe("/booking?serviceId=service-1");

    const loginHref = buildLoginHref(bookingHref);
    expect(loginHref).toBe("/login?next=%2Fbooking%3FserviceId%3Dservice-1");

    const preserved = new URL(
      loginHref,
      "https://flashwrench.local",
    ).searchParams.get("next");
    expect(getSafeNextPath(preserved)).toBe(bookingHref);
    expect(resolvePostAuthHref("customer", preserved)).toBe(bookingHref);
  });

  test("logged-in visits never bounce back to an auth form", () => {
    expect(getSafeNextPath("/login")).toBeNull();
    expect(getSafeNextPath("/register?next=/booking")).toBeNull();
    expect(resolvePostAuthHref("customer", "/login")).toBe("/");
    expect(resolvePostAuthHref("customer", "/register")).toBe("/");
  });

  test("booking without a service stays a valid entry, not a silent fallback", () => {
    expect(buildBookingHref(null)).toBe("/booking");
    expect(getSafeNextPath("/booking")).toBe("/booking");
    expect(resolvePostAuthHref("customer", "/booking")).toBe("/booking");
  });

  test("no booking CTA ever targets an auth page for logged-in users", () => {
    // Every booking entry resolves to /booking (optionally preselected);
    // /booking itself is a safe post-auth target, so the confirmation
    // after POST /api/bookings never routes through /login or /register.
    expect(buildBookingHref("service-1")).toBe("/booking?serviceId=service-1");
    expect(getSafeNextPath(buildBookingHref("service-1"))).toBe(
      "/booking?serviceId=service-1",
    );
    expect(getSafeNextPath("/login?next=/booking")).toBeNull();
    expect(getSafeNextPath("/register?next=/booking")).toBeNull();
  });
});
