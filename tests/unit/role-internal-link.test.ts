// Role-based internal navigation for the account menus. Pure helper, so no
// mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import {
  ADMIN_LINK,
  DISPATCH_LINK,
  getRoleInternalLink,
  MECHANIC_LINK,
} from "@/components/layout/site-header.constants";

describe("getRoleInternalLink", () => {
  test("admin goes to the admin workspace", () => {
    expect(getRoleInternalLink("admin")).toEqual(ADMIN_LINK);
    expect(getRoleInternalLink("admin")?.href).toBe("/admin");
  });

  test("mechanic goes to the mechanic workspace", () => {
    expect(getRoleInternalLink("mechanic")).toEqual(MECHANIC_LINK);
    expect(getRoleInternalLink("mechanic")?.href).toBe("/mechanic");
  });

  test("dispatcher goes to the dispatch workspace", () => {
    expect(getRoleInternalLink("dispatcher")).toEqual(DISPATCH_LINK);
    expect(getRoleInternalLink("dispatcher")?.href).toBe("/dispatch");
  });

  test("customer has no internal page", () => {
    expect(getRoleInternalLink("customer")).toBeNull();
  });

  test("missing role stays null", () => {
    expect(getRoleInternalLink(null)).toBeNull();
    expect(getRoleInternalLink(undefined)).toBeNull();
  });

  test("labels stay Vietnamese with diacritics", () => {
    expect(ADMIN_LINK.label).toBe("Trang quản trị");
    expect(MECHANIC_LINK.label).toBe("Khu vực thợ xe");
    expect(DISPATCH_LINK.label).toBe("Khu vực điều phối");
  });
});
