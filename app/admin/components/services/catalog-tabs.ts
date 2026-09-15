export type CatalogTab = "categories" | "prices" | "trash";

export const CATALOG_TABS: { id: CatalogTab; label: string }[] = [
  { id: "categories", label: "Loại hình" },
  { id: "prices", label: "Bảng giá" },
  { id: "trash", label: "Thùng rác" },
];
