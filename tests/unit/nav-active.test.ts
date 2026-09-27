import { describe, expect, test } from "bun:test";
import { isNavActive } from "@/components/layout/nav-active";

// Regression for the header highlighting Home while on /rescue:
// the header used to compare with `===` and always fell back to "/".
describe("isNavActive", () => {
  test("highlights Rescue on /rescue and Home only on /", () => {
    expect(isNavActive("/rescue", "/rescue")).toBe(true);
    expect(isNavActive("/rescue", "/")).toBe(false);
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/", "/rescue")).toBe(false);
  });

  test("stays active on sub-routes except Home", () => {
    expect(isNavActive("/services/vo-phanh", "/services")).toBe(true);
    expect(isNavActive("/history/orders", "/history")).toBe(true);
    expect(isNavActive("/products", "/")).toBe(false);
  });
});
