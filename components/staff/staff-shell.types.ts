import type { IconType } from "react-icons";

// One sidebar entry. Every staff portal (dispatch, mechanic, admin)
// describes its sections with this shape so the shared shell can render
// them without knowing the portal.
export type StaffNavSection<Id extends string = string> = {
  id: Id;
  label: string;
  description: string;
  href: string;
  icon: IconType;
};

// Portal-specific wording for the shared chrome. `scope` completes the
// Vietnamese accessible labels, e.g. "Mở menu {scope}".
export type StaffShellCopy = {
  areaName: string;
  scope: string;
};
