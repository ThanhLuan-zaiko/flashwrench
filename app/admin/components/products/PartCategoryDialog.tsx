"use client";

import { useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { DialogFooter } from "@/components/ui/DialogFooter";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { DialogPanel } from "@/components/ui/DialogPanel";
import { DIALOG_OVERLAY_CLASSES } from "@/components/ui/dialog-overlay";
import {
  useCreatePartCategory,
  useUpdatePartCategory,
} from "@/hooks/admin-parts";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { slugifyName } from "@/lib/catalog/catalog-validation";
import type { PartCategoryItem } from "@/lib/parts/parts.types";
import { fieldError, formError } from "../services/catalog-errors";

export type PartCategoryDialogState =
  | { mode: "create" }
  | { mode: "edit"; item: PartCategoryItem };

type PartCategoryDialogProps = {
  dialog: PartCategoryDialogState | null;
  onClose: () => void;
};

// Create/edit modal for one part category. The slug doubles as the
// hard-delete confirmation code.
export function PartCategoryDialog({
  dialog,
  onClose,
}: PartCategoryDialogProps) {
  const editing = dialog?.mode === "edit" ? dialog.item : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0));
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));

  const createMutation = useCreatePartCategory();
  const updateMutation = useUpdatePartCategory();
  const pending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? null;

  const dirty =
    pending ||
    name !== (editing?.name ?? "") ||
    slug !== (editing?.slug ?? "") ||
    icon !== (editing?.icon ?? "") ||
    description !== (editing?.description ?? "") ||
    sortOrder !== String(editing?.sortOrder ?? 0);
  const guard = useUnsavedChangesGuard(dirty, onClose);

  if (!dialog) return null;

  const submit = () => {
    if (pending) return;
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      icon: icon.trim(),
      description: description.trim(),
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
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

  const alert = formError(error, "Không lưu được danh mục.");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa danh mục" : "Thêm danh mục"}
      className={DIALOG_OVERLAY_CLASSES}
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={guard.requestClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <DialogPanel wide>
        <DialogHeader
          title={editing ? "Sửa danh mục" : "Thêm danh mục"}
          hint="Mỗi danh mục có một mã riêng, dùng để xác nhận khi xóa vĩnh viễn."
          onClose={guard.requestClose}
        />
        <div className="mt-4 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Tên danh mục
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugifyName(e.target.value));
              }}
              placeholder="Lọc dầu, phanh, điện…"
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
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="loc-dau"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {fieldError(error, "slug") && (
              <span className="font-medium text-red-600 dark:text-red-400">
                {fieldError(error, "slug")}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Biểu tượng (emoji, không bắt buộc)
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🛢️"
              className="h-11 w-32 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Mô tả
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Nhóm linh kiện thay thế định kỳ…"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Thứ tự hiển thị
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              inputMode="numeric"
              className="h-11 w-32 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {fieldError(error, "sortOrder") && (
              <span className="font-medium text-red-600 dark:text-red-400">
                {fieldError(error, "sortOrder")}
              </span>
            )}
          </label>
        </div>
        {alert && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {alert}
          </p>
        )}
        <DialogFooter
          submitLabel={
            pending ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo danh mục"
          }
          pending={pending}
          onClose={guard.requestClose}
          onSubmit={submit}
        />
        <ConfirmDiscardDialog
          open={guard.confirmOpen}
          onStay={guard.stay}
          onDiscard={guard.discard}
        />
      </DialogPanel>
    </div>
  );
}
