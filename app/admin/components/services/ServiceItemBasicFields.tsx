"use client";

import { slugifyName } from "@/lib/catalog/catalog-validation";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";
import { fieldError } from "./catalog-errors";
import { SelectDropdown } from "./SelectDropdown";

type ServiceItemBasicFieldsProps = {
  editing: boolean;
  categoryId: string;
  categories: ServiceCategoryItem[];
  name: string;
  slug: string;
  error: unknown;
  hasNoCategories: boolean;
  onCategoryId: (value: string) => void;
  onName: (value: string) => void;
  onSlug: (value: string) => void;
};

// Category, name and slug inputs shared by the service dialog. Kept
// apart so the dialog stays under the file line limit once the cover
// image field joins it.
export function ServiceItemBasicFields({
  editing,
  categoryId,
  categories,
  name,
  slug,
  error,
  hasNoCategories,
  onCategoryId,
  onName,
  onSlug,
}: ServiceItemBasicFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <SelectDropdown
          label="Loại hình"
          value={categoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          onChange={onCategoryId}
          placeholder="Chọn loại hình"
          listLabel="Chọn loại hình"
          searchPlaceholder="Tìm loại hình…"
          unitName="loại hình"
          emptyTitle="Không tìm thấy loại hình phù hợp"
        />
        {fieldError(error, "categoryId") && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "categoryId")}
          </span>
        )}
        {hasNoCategories && (
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Chưa có loại hình nào. Hãy tạo loại hình trước khi thêm mục giá.
          </span>
        )}
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Tên dịch vụ
        <input
          value={name}
          onChange={(e) => {
            onName(e.target.value);
            if (!editing) onSlug(slugifyName(e.target.value));
          }}
          placeholder="Thay dầu động cơ"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {fieldError(error, "name") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "name")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Mã định danh
        <input
          value={slug}
          onChange={(e) => onSlug(e.target.value)}
          placeholder="thay-dau-dong-co"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {fieldError(error, "slug") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "slug")}
          </span>
        )}
      </label>
    </>
  );
}
