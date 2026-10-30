// The two-part staff sidebar opens the group that owns the active section,
// lists only that group's sections, and flags groups with pending badges.
// Every portal must assign each section to one of its declared groups.
import { describe, expect, test } from "bun:test";
import {
  ADMIN_NAV_GROUPS,
  ADMIN_SECTIONS,
} from "@/app/admin/components/admin-sections";
import {
  DISPATCH_NAV_GROUPS,
  DISPATCH_SECTIONS,
} from "@/app/dispatch/components/dispatch-sections";
import {
  MECHANIC_NAV_GROUPS,
  MECHANIC_SECTIONS,
} from "@/app/mechanic/components/mechanic-sections";
import {
  groupBadgeTotal,
  groupIdForSection,
  sectionsInGroup,
} from "@/components/staff/staff-nav-groups";

describe("groupIdForSection", () => {
  test("returns the group that owns the active section", () => {
    expect(
      groupIdForSection(DISPATCH_NAV_GROUPS, DISPATCH_SECTIONS, "stock"),
    ).toBe("stock");
    expect(
      groupIdForSection(DISPATCH_NAV_GROUPS, DISPATCH_SECTIONS, "revenue"),
    ).toBe("reports");
    expect(
      groupIdForSection(ADMIN_NAV_GROUPS, ADMIN_SECTIONS, "settings"),
    ).toBe("system");
  });

  test("falls back to the first group for unknown sections", () => {
    expect(
      groupIdForSection(MECHANIC_NAV_GROUPS, MECHANIC_SECTIONS, "nope"),
    ).toBe("work");
    expect(groupIdForSection([], MECHANIC_SECTIONS, "schedule")).toBe("");
  });
});

describe("sectionsInGroup", () => {
  test("keeps declaration order within a group", () => {
    expect(sectionsInGroup(DISPATCH_SECTIONS, "ops").map((s) => s.id)).toEqual([
      "board",
      "rescue",
      "orders",
    ]);
    expect(sectionsInGroup(DISPATCH_SECTIONS, "missing")).toEqual([]);
  });
});

describe("groupBadgeTotal", () => {
  test("sums badges of the group's sections only", () => {
    const badges = { board: 4, rescue: 2, stock: 9 };
    expect(groupBadgeTotal(DISPATCH_SECTIONS, "ops", badges)).toBe(6);
    expect(groupBadgeTotal(DISPATCH_SECTIONS, "reports", badges)).toBe(0);
    expect(groupBadgeTotal(DISPATCH_SECTIONS, "ops")).toBe(0);
  });
});

describe("portal group coverage", () => {
  const portals = [
    [DISPATCH_NAV_GROUPS, DISPATCH_SECTIONS],
    [MECHANIC_NAV_GROUPS, MECHANIC_SECTIONS],
    [ADMIN_NAV_GROUPS, ADMIN_SECTIONS],
  ] as const;

  test("every section belongs to a declared group and no group is empty", () => {
    for (const [groups, sections] of portals) {
      const ids = groups.map((g) => g.id);
      for (const section of sections) expect(ids).toContain(section.group);
      for (const id of ids)
        expect(sectionsInGroup([...sections], id).length).toBeGreaterThan(0);
    }
  });
});
