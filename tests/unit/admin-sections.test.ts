// Sidebar active section derives from the URL: every /admin/* subtree must
// light up its own nav item, and unknown paths fall back to the dashboard.
import { describe, expect, test } from "bun:test";
import {
  ADMIN_SECTIONS,
  getAdminSection,
  sectionIdForPath,
} from "@/app/admin/components/admin-sections";

describe("sectionIdForPath", () => {
  test("maps each admin subtree to its own section", () => {
    expect(sectionIdForPath("/admin")).toBe("dashboard");
    expect(sectionIdForPath("/admin/users")).toBe("users");
    expect(sectionIdForPath("/admin/users/abc")).toBe("users");
    expect(sectionIdForPath("/admin/services")).toBe("services");
    expect(sectionIdForPath("/admin/services/categories")).toBe("services");
    expect(sectionIdForPath("/admin/products")).toBe("products");
    expect(sectionIdForPath("/admin/products/parts")).toBe("products");
    expect(sectionIdForPath("/admin/products/categories")).toBe("products");
    expect(sectionIdForPath("/admin/products/trash")).toBe("products");
  });

  test("falls back to dashboard for unknown paths", () => {
    expect(sectionIdForPath("/")).toBe("dashboard");
    expect(sectionIdForPath("/admin/unknown")).toBe("dashboard");
    expect(sectionIdForPath("/booking")).toBe("dashboard");
  });
});

describe("getAdminSection", () => {
  test("resolves a declared section and defaults to dashboard", () => {
    expect(getAdminSection("products").href).toBe("/admin/products/categories");
    expect(getAdminSection("users").href).toBe("/admin/users");
    expect(ADMIN_SECTIONS.map((s) => s.id)).toContain("products");
  });
});
