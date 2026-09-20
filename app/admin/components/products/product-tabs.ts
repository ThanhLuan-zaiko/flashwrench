import type { IconType } from "react-icons";
import { FiLayers, FiPackage, FiTrash2 } from "react-icons/fi";

export type ProductTab = "categories" | "parts" | "trash";

export type ProductTabDef = {
  id: ProductTab;
  label: string;
  href: string;
  icon: IconType;
  title: string;
  description: string;
};

function tabHref(id: ProductTab): string {
  return `/admin/products/${id}`;
}

export const PRODUCT_TABS: ProductTabDef[] = [
  {
    id: "categories",
    label: "Danh mục",
    href: tabHref("categories"),
    icon: FiLayers,
    title: "Danh mục | Quản lý sản phẩm",
    description: "Quản lý danh mục linh kiện của FlashWrench.",
  },
  {
    id: "parts",
    label: "Sản phẩm",
    href: tabHref("parts"),
    icon: FiPackage,
    title: "Sản phẩm | Quản lý sản phẩm",
    description: "Quản lý linh kiện đang bán trên cửa hàng.",
  },
  {
    id: "trash",
    label: "Thùng rác",
    href: tabHref("trash"),
    icon: FiTrash2,
    title: "Thùng rác | Quản lý sản phẩm",
    description: "Khôi phục hoặc xóa vĩnh viễn danh mục và sản phẩm.",
  },
];

export function isProductTab(value: unknown): value is ProductTab {
  return value === "categories" || value === "parts" || value === "trash";
}
