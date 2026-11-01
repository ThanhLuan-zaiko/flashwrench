import { describe, expect, test } from "bun:test";
import {
  FOOTER_COLUMNS,
  FOOTER_HOTLINE,
} from "@/components/layout/site-footer.content";
import { footerHidden } from "@/components/layout/site-footer.routes";

describe("footerHidden", () => {
  test("shows on public pages", () => {
    expect(footerHidden("/")).toBe(false);
    expect(footerHidden("/services")).toBe(false);
    expect(footerHidden("/login")).toBe(false);
  });

  test("hides on staff portals and flow screens", () => {
    expect(footerHidden("/admin")).toBe(true);
    expect(footerHidden("/dispatch/orders/page/2")).toBe(true);
    expect(footerHidden("/mechanic/schedule")).toBe(true);
    expect(footerHidden("/booking")).toBe(true);
    expect(footerHidden("/track/ABC")).toBe(true);
  });

  test("does not hide a route that only shares a prefix", () => {
    expect(footerHidden("/administration-notes")).toBe(false);
    expect(footerHidden("/bookings-archive")).toBe(false);
  });

  test("shows when the pathname is not known yet", () => {
    expect(footerHidden(null)).toBe(false);
  });
});

describe("footer content", () => {
  test("every column link is an in-app path", () => {
    for (const column of FOOTER_COLUMNS) {
      for (const link of column.links) {
        expect(link.href.startsWith("/")).toBe(true);
      }
    }
  });

  test("the hotline is a tel: link with the digits only", () => {
    expect(FOOTER_HOTLINE.href).toBe("tel:19006368");
  });
});
