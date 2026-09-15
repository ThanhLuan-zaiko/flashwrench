export type CatalogTab = "categories" | "prices" | "trash";

export type CatalogTabDef = { id: CatalogTab; label: string; href: string };

function tabHref(id: CatalogTab): string {
  return `/admin/services/${id}`;
}

export const CATALOG_TABS: CatalogTabDef[] = [
  { id: "categories", label: "Loại hình", href: tabHref("categories") },
  { id: "prices", label: "Bảng giá", href: tabHref("prices") },
  { id: "trash", label: "Thùng rác", href: tabHref("trash") },
];

export function isCatalogTab(value: unknown): value is CatalogTab {
  return value === "categories" || value === "prices" || value === "trash";
}

export function catalogTabHref(id: CatalogTab): string {
  return tabHref(id);
}
