"use client";

import { fieldError } from "../services/catalog-errors";

type PartExtraFieldsProps = {
  carBrands: string;
  carModels: string;
  specsText: string;
  description: string;
  error: unknown;
  onCarBrands: (value: string) => void;
  onCarModels: (value: string) => void;
  onSpecsText: (value: string) => void;
  onDescription: (value: string) => void;
};

const LABEL_CLASSES =
  "flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300";

const INPUT_CLASSES =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const TEXTAREA_CLASSES =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

// Compatibility (car brands/models) plus specs and description inputs.
// Lists edit as comma-separated text; specs edit as "key: value" lines —
// both parse on save so admins never touch JSON.
export function PartExtraFields({
  carBrands,
  carModels,
  specsText,
  description,
  error,
  onCarBrands,
  onCarModels,
  onSpecsText,
  onDescription,
}: PartExtraFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={LABEL_CLASSES}>
          Hãng xe tương thích (phẩy)
          <input
            value={carBrands}
            onChange={(e) => onCarBrands(e.target.value)}
            placeholder="Toyota, Honda, Ford"
            className={INPUT_CLASSES}
          />
          {fieldError(error, "carBrands") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "carBrands")}
            </span>
          )}
        </label>
        <label className={LABEL_CLASSES}>
          Dòng xe tương thích (phẩy)
          <input
            value={carModels}
            onChange={(e) => onCarModels(e.target.value)}
            placeholder="Vios 2018-2023, City 2020+"
            className={INPUT_CLASSES}
          />
          {fieldError(error, "carModels") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "carModels")}
            </span>
          )}
        </label>
      </div>
      <label className={LABEL_CLASSES}>
        Thông số kỹ thuật (mỗi dòng &quot;tên: giá trị&quot;)
        <textarea
          value={specsText}
          onChange={(e) => onSpecsText(e.target.value)}
          rows={3}
          placeholder={"Xuất xứ: Đức\nBảo hành: 6 tháng"}
          className={`${TEXTAREA_CLASSES} font-mono`}
        />
        {fieldError(error, "specs") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "specs")}
          </span>
        )}
      </label>
      <label className={LABEL_CLASSES}>
        Mô tả sản phẩm
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={3}
          placeholder="Lọc dầu chính hãng, lọc sạch tạp chất 20µm…"
          className={TEXTAREA_CLASSES}
        />
        {fieldError(error, "description") && (
          <span className="font-medium text-red-600 dark:text-red-400">
            {fieldError(error, "description")}
          </span>
        )}
      </label>
    </>
  );
}
