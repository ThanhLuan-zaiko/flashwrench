import type { IconType } from "react-icons";
import { FiLayers, FiTag, FiTrash2 } from "react-icons/fi";

export type CatalogTab = "categories" | "prices" | "trash";

export type CatalogTabDef = {
  id: CatalogTab;
  label: string;
  href: string;
  icon: IconType;
  title: string;
  description: string;
};

function tabHref(id: CatalogTab): string {
  return `/admin/services/${id}`;
}

export const CATALOG_TABS: CatalogTabDef[] = [
  {
    id: "categories",
    label: "Loại hình",
    href: tabHref("categories"),
    icon: FiLayers,
    title: "Loại hình | Cấu hình dịch vụ",
    description: "Quản lý loại hình sửa chữa của FlashWrench.",
  },
  {
    id: "prices",
    label: "Bảng giá",
    href: tabHref("prices"),
    icon: FiTag,
    title: "Bảng giá | Cấu hình dịch vụ",
    description: "Quản lý bảng giá sửa chữa của FlashWrench.",
  },
  {
    id: "trash",
    label: "Thùng rác",
    href: tabHref("trash"),
    icon: FiTrash2,
    title: "Thùng rác | Cấu hình dịch vụ",
    description: "Khôi phục hoặc xóa vĩnh viễn loại hình và bảng giá.",
  },
];

export function isCatalogTab(value: unknown): value is CatalogTab {
  return value === "categories" || value === "prices" || value === "trash";
}

export function catalogTabHref(id: CatalogTab): string {
  return tabHref(id);
}
