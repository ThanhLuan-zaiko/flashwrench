"use client";

import { slugifyName } from "@/lib/catalog/catalog-validation";
import { fieldError } from "./catalog-errors";

type ServiceCategoryBasicFieldsProps = {
  name: string;
  slug: string;
  icon: string;
  slugTouched: boolean;
  error: unknown;
  onName: (value: string) => void;
  onSlug: (value: string) => void;
  onSlugTouched: () => void;
  onRegenSlug: () => void;
  onIcon: (value: string) => void;
};

// Name, slug and icon inputs for the category dialog. Extracted so the
// dialog stays under the file line limit once the gallery field joins.
export function ServiceCategoryBasicFields({
  name,
  slug,
  icon,
  slugTouched,
  error,
  onName,
  onSlug,
  onSlugTouched,
  onRegenSlug,
  onIcon,
}: ServiceCategoryBasicFieldsProps) {
  void slugTouched;
  return (
    <>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Tên loại hình
        <input
          value={name}
          onChange={(e) => {
            onName(e.target.value);
            if (!slugTouched) onSlug(slugifyName(e.target.value));
          }}
          placeholder="Bảo dưỡng tại nhà"
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
        <span className="flex gap-2">
          <input
            value={slug}
            onChange={(e) => {
              onSlug(e.target.value);
              onSlugTouched();
            }}
            placeholder="bao-duong-tai-nha"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={onRegenSlug}
            className="flex h-11 shrink-0 items-center rounded-xl border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Tạo từ tên
          </button>
        </span>
        {fieldError(error, "slug") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "slug")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Icon (tùy chọn)
        <input
          value={icon}
          onChange={(e) => onIcon(e.target.value)}
          placeholder="wrench"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {fieldError(error, "icon") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "icon")}
          </span>
        )}
      </label>
    </>
  );
}
