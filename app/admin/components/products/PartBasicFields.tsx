"use client";

import { slugifyName } from "@/lib/catalog/catalog-validation";
import type { PartCategoryItem } from "@/lib/parts/parts.types";
import { fieldError } from "../services/catalog-errors";
import { SelectDropdown } from "../services/SelectDropdown";

type PartBasicFieldsProps = {
  editing: boolean;
  categoryId: string;
  categories: PartCategoryItem[];
  name: string;
  slug: string;
  sku: string;
  brand: string;
  error: unknown;
  hasNoCategories: boolean;
  onCategoryId: (value: string) => void;
  onName: (value: string) => void;
  onSlug: (value: string) => void;
  onSku: (value: string) => void;
  onBrand: (value: string) => void;
};

const INPUT_CLASSES =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const LABEL_CLASSES =
  "flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300";

// Category picker plus name/slug/sku/brand inputs for the part dialog.
export function PartBasicFields({
  editing,
  categoryId,
  categories,
  name,
  slug,
  sku,
  brand,
  error,
  hasNoCategories,
  onCategoryId,
  onName,
  onSlug,
  onSku,
  onBrand,
}: PartBasicFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <SelectDropdown
          label="Danh mục"
          value={categoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          onChange={onCategoryId}
          placeholder="Chọn danh mục"
          listLabel="Chọn danh mục"
          searchPlaceholder="Tìm danh mục…"
          unitName="danh mục"
          emptyTitle="Không tìm thấy danh mục phù hợp"
        />
        {fieldError(error, "categoryId") && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "categoryId")}
          </span>
        )}
        {hasNoCategories && (
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Chưa có danh mục nào. Hãy tạo danh mục trước khi thêm sản phẩm.
          </span>
        )}
      </div>
      <label className={LABEL_CLASSES}>
        Tên sản phẩm
        <input
          value={name}
          onChange={(e) => {
            onName(e.target.value);
            if (!editing) onSlug(slugifyName(e.target.value));
          }}
          placeholder="Lọc dầu Bosch P2040"
          className={INPUT_CLASSES}
        />
        {fieldError(error, "name") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "name")}
          </span>
        )}
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSES}>
          Mã định danh (slug)
          <input
            value={slug}
            onChange={(e) => onSlug(e.target.value)}
            placeholder="loc-dau-bosch-p2040"
            className={`${INPUT_CLASSES} font-mono`}
          />
          {fieldError(error, "slug") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "slug")}
            </span>
          )}
        </label>
        <label className={LABEL_CLASSES}>
          Mã SKU
          <input
            value={sku}
            onChange={(e) => onSku(e.target.value)}
            placeholder="BOS-P2040"
            className={`${INPUT_CLASSES} font-mono`}
          />
          {fieldError(error, "sku") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "sku")}
            </span>
          )}
        </label>
      </div>
      <label className={LABEL_CLASSES}>
        Hãng sản xuất
        <input
          value={brand}
          onChange={(e) => onBrand(e.target.value)}
          placeholder="Bosch, Denso, NGK…"
          className={INPUT_CLASSES}
        />
        {fieldError(error, "brand") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "brand")}
          </span>
        )}
      </label>
    </>
  );
}
