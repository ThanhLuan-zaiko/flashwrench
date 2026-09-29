// URL /page/N helpers: strict integer parsing, canonical page-1 paths
// and the pathname strip used by mount-once shells.
import { describe, expect, test } from "bun:test";
import {
  pagePath,
  parsePageParam,
  stripPageSegment,
} from "@/lib/pagination/page-param";

describe("parsePageParam", () => {
  test("accepts positive integers", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("42")).toBe(42);
  });

  test("accepts the first entry of a catch-all array", () => {
    expect(parsePageParam(["3", "extra"])).toBe(3);
  });

  test("rejects missing, non-numeric, zero and negative input", () => {
    expect(parsePageParam(undefined)).toBeNull();
    expect(parsePageParam(null)).toBeNull();
    expect(parsePageParam("")).toBeNull();
    expect(parsePageParam("abc")).toBeNull();
    expect(parsePageParam("0")).toBeNull();
    expect(parsePageParam("-2")).toBeNull();
    expect(parsePageParam("1.5")).toBeNull();
    expect(parsePageParam(" 2")).toBeNull();
    expect(parsePageParam("2x")).toBeNull();
  });
});

describe("pagePath", () => {
  test("page 1 is the bare base path", () => {
    expect(pagePath("/services", 1)).toBe("/services");
    expect(pagePath("/services", 0)).toBe("/services");
  });

  test("deeper pages append the page segment", () => {
    expect(pagePath("/services", 2)).toBe("/services/page/2");
    expect(pagePath("/admin/users/staff", 9)).toBe("/admin/users/staff/page/9");
  });
});

describe("stripPageSegment", () => {
  test("removes a trailing page segment", () => {
    expect(stripPageSegment("/services/page/2")).toBe("/services");
    expect(stripPageSegment("/admin/orders/pending/page/7")).toBe(
      "/admin/orders/pending",
    );
  });

  test("leaves other paths untouched", () => {
    expect(stripPageSegment("/services")).toBe("/services");
    expect(stripPageSegment("/admin/orders/pending")).toBe(
      "/admin/orders/pending",
    );
    expect(stripPageSegment("/blog/page-a-day")).toBe("/blog/page-a-day");
  });
});
