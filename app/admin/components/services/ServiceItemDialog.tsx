"use client";

import { useEffect, useMemo, useState } from "react";
import { FiLoader, FiSave, FiX } from "react-icons/fi";
import { useCreateService, useUpdateService } from "@/hooks/service-catalog";
import { slugifyName } from "@/lib/catalog/catalog-validation";
import type {
  PriceUnit,
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import { AuthApiError } from "@/services/service-catalog.api";
import { fieldError } from "./catalog-errors";
import { SelectDropdown } from "./SelectDropdown";
import { ServiceItemPricingFields } from "./ServiceItemPricingFields";
import { ServiceItemSupportFields } from "./ServiceItemSupportFields";

export type ServiceDialogState =
  | { mode: "create"; presetCategoryId?: string }
  | { mode: "edit"; item: ServiceItem };

type ServiceItemDialogProps = {
  dialog: ServiceDialogState | null;
  categories: ServiceCategoryItem[];
  onClose: () => void;
};

// Create/edit modal for one price row. Parent passes a keyed instance so
// form state resets on every open. The category default still syncs via
// effect because the category list can arrive after the dialog mounts.
export function ServiceItemDialog({
  dialog,
  categories,
  onClose,
}: ServiceItemDialogProps) {
  const editing = dialog?.mode === "edit" ? dialog.item : null;
  const preset =
    dialog?.mode === "create" ? (dialog.presetCategoryId ?? "") : "";
  const live = useMemo(
    () => categories.filter((c) => !c.isDeleted),
    [categories],
  );
  const liveFirstId = live[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ?? preset ?? liveFirstId,
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [basePrice, setBasePrice] = useState(
    String(editing?.basePrice ?? 199000),
  );
  const [priceUnit, setPriceUnit] = useState<PriceUnit>(
    editing?.priceUnit ?? "per_job",
  );
  const [durationMin, setDurationMin] = useState(
    String(editing?.durationMin ?? 60),
  );
  const [isHomeSupported, setIsHomeSupported] = useState(
    editing?.isHomeSupported ?? true,
  );
  const [isEmergencySupported, setIsEmergencySupported] = useState(
    editing?.isEmergencySupported ?? false,
  );

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const pending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? null;
  const hasNoCategories = !editing && live.length === 0;

  useEffect(() => {
    if (editing || live.length === 0) return;
    if (!categoryId || !live.some((c) => c.id === categoryId)) {
      if (liveFirstId) setCategoryId(liveFirstId);
    }
  }, [editing, categoryId, live, liveFirstId]);

  if (!dialog) return null;

  const submit = () => {
    const payload = {
      categoryId,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      basePrice: Number.parseInt(basePrice, 10) || 0,
      priceUnit,
      durationMin: Number.parseInt(durationMin, 10) || 0,
      isHomeSupported,
      isEmergencySupported,
      isActive: editing?.isActive ?? true,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa mục giá" : "Thêm mục giá"}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {editing ? "Sửa mục giá" : "Thêm mục giá"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Giá tính bằng VND, mã riêng dùng để xác nhận khi xóa vĩnh viễn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <SelectDropdown
              label="Loại hình"
              value={categoryId}
              options={live.map((c) => ({ value: c.id, label: c.name }))}
              onChange={setCategoryId}
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
                setName(e.target.value);
                if (!editing) setSlug(slugifyName(e.target.value));
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
              onChange={(e) => setSlug(e.target.value)}
              placeholder="thay-dau-dong-co"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {fieldError(error, "slug") && (
              <span className="font-medium text-red-600 dark:text-red-400">
                {fieldError(error, "slug")}
              </span>
            )}
          </label>
          <ServiceItemPricingFields
            basePrice={basePrice}
            priceUnit={priceUnit}
            durationMin={durationMin}
            description={description}
            basePriceError={fieldError(error, "basePrice")}
            durationError={fieldError(error, "durationMin")}
            onBasePrice={setBasePrice}
            onPriceUnit={setPriceUnit}
            onDuration={setDurationMin}
            onDescription={setDescription}
          />
          <ServiceItemSupportFields
            isHomeSupported={isHomeSupported}
            isEmergencySupported={isEmergencySupported}
            onHomeSupported={setIsHomeSupported}
            onEmergencySupported={setIsEmergencySupported}
          />
        </div>

        {error instanceof AuthApiError && error.errors.form && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error.errors.form}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={pending || (!editing && !categoryId)}
            onClick={submit}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            ) : (
              <FiSave aria-hidden="true" className="h-4 w-4" />
            )}
            {pending ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo mục giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
