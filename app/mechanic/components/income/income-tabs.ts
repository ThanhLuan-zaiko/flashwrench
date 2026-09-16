// One URL per income filter tab so links stay shareable and the browser
// back button works. Mirrors the admin catalog/user tab helpers.
import type { IconType } from "react-icons";
import { FiClock, FiDollarSign, FiLayers, FiRotateCcw } from "react-icons/fi";

export type IncomeTab = "all" | "paid" | "pending" | "refunded";

export type IncomeTabDef = {
  id: IncomeTab;
  label: string;
  href: string;
  icon: IconType;
};

function tabHref(id: IncomeTab): string {
  return `/mechanic/income/${id}`;
}

export const INCOME_TABS: IncomeTabDef[] = [
  { id: "all", label: "Tất cả", href: tabHref("all"), icon: FiLayers },
  { id: "paid", label: "Đã thu", href: tabHref("paid"), icon: FiDollarSign },
  {
    id: "pending",
    label: "Chờ thu",
    href: tabHref("pending"),
    icon: FiClock,
  },
  {
    id: "refunded",
    label: "Đã hoàn",
    href: tabHref("refunded"),
    icon: FiRotateCcw,
  },
];

export function isIncomeTab(value: unknown): value is IncomeTab {
  return INCOME_TABS.some((tab) => tab.id === value);
}

export function incomeTabHref(id: IncomeTab): string {
  return tabHref(id);
}
