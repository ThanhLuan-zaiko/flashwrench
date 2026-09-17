import { describe, expect, test } from "bun:test";
import { shouldGuardNavigation } from "@/hooks/useUnsavedChangesGuard";

const CURRENT = "/admin/services/categories";

describe("shouldGuardNavigation", () => {
  test("guards in-app page and tab switches", () => {
    expect(
      shouldGuardNavigation({
        href: "/admin/services/prices",
        currentPath: CURRENT,
      }),
    ).toBe(true);
    expect(
      shouldGuardNavigation({ href: "/admin/users", currentPath: CURRENT }),
    ).toBe(true);
  });

  test("ignores clicks that keep the dialog mounted", () => {
    expect(shouldGuardNavigation({ href: null, currentPath: CURRENT })).toBe(
      false,
    );
    expect(
      shouldGuardNavigation({ href: "#gallery", currentPath: CURRENT }),
    ).toBe(false);
    expect(shouldGuardNavigation({ href: CURRENT, currentPath: CURRENT })).toBe(
      false,
    );
    expect(
      shouldGuardNavigation({
        href: "/admin/services/categories?page=2",
        currentPath: CURRENT,
      }),
    ).toBe(false);
  });

  test("ignores new-tab, modifier and download clicks", () => {
    const base = { href: "/admin/users", currentPath: CURRENT };
    expect(shouldGuardNavigation({ ...base, target: "_blank" })).toBe(false);
    expect(shouldGuardNavigation({ ...base, button: 1 })).toBe(false);
    expect(shouldGuardNavigation({ ...base, ctrlKey: true })).toBe(false);
    expect(shouldGuardNavigation({ ...base, metaKey: true })).toBe(false);
    expect(shouldGuardNavigation({ ...base, download: true })).toBe(false);
  });

  test("ignores externals: real unloads keep the native prompt", () => {
    expect(
      shouldGuardNavigation({
        href: "https://cdn.test/x.jpg",
        currentPath: CURRENT,
      }),
    ).toBe(false);
    expect(
      shouldGuardNavigation({ href: "mailto:a@b.c", currentPath: CURRENT }),
    ).toBe(false);
  });
});
