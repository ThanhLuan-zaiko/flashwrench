export type UserTab = "approve" | "lock" | "complaints";

export type UserTabDef = { id: UserTab; label: string; href: string };

function tabHref(id: UserTab): string {
  return `/admin/users/${id}`;
}

export const USER_TABS: UserTabDef[] = [
  { id: "approve", label: "Duyệt thợ", href: tabHref("approve") },
  { id: "lock", label: "Khóa tài khoản", href: tabHref("lock") },
  { id: "complaints", label: "Khiếu nại", href: tabHref("complaints") },
];

export function isUserTab(value: unknown): value is UserTab {
  return value === "approve" || value === "lock" || value === "complaints";
}

export function userTabHref(id: UserTab): string {
  return tabHref(id);
}
