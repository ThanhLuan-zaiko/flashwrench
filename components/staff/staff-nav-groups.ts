import type { StaffNavGroup, StaffNavSection } from "./staff-shell.types";

// Group id that owns the active section; falls back to the first group so
// the panel never renders empty.
export function groupIdForSection(
  groups: StaffNavGroup[],
  sections: StaffNavSection[],
  activeId: string,
): string {
  const owner = sections.find((section) => section.id === activeId)?.group;
  if (owner && groups.some((group) => group.id === owner)) return owner;
  return groups[0]?.id ?? "";
}

// Sections listed under one group, in declaration order.
export function sectionsInGroup(
  sections: StaffNavSection[],
  groupId: string,
): StaffNavSection[] {
  return sections.filter((section) => section.group === groupId);
}

// Sum of badge counts per group so the rail can flag a group whose
// sections have pending work while another group is open.
export function groupBadgeTotal(
  sections: StaffNavSection[],
  groupId: string,
  badges?: Partial<Record<string, number>>,
): number {
  return sectionsInGroup(sections, groupId).reduce(
    (total, section) => total + (badges?.[section.id] ?? 0),
    0,
  );
}
