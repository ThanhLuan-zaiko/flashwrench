// Only booking/checkout/track flows swap the site header for a TaskBar on
// phones; staff portals keep the (navy) site header.
import { describe, expect, test } from "bun:test";
import { usesTaskBar } from "@/components/layout/header-tone";

describe("usesTaskBar", () => {
  test("matches flow routes and their children", () => {
    expect(usesTaskBar("/booking")).toBe(true);
    expect(usesTaskBar("/checkout")).toBe(true);
    expect(usesTaskBar("/track/abc")).toBe(true);
  });

  test("leaves staff portals and look-alike paths on the site header", () => {
    expect(usesTaskBar("/dispatch/bookings/pending")).toBe(false);
    expect(usesTaskBar("/mechanic")).toBe(false);
    expect(usesTaskBar("/admin")).toBe(false);
    expect(usesTaskBar("/bookings")).toBe(false);
  });
});
