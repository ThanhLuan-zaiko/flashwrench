"use client";

import { useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { DialogFooter } from "@/components/ui/DialogFooter";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { DialogPanel } from "@/components/ui/DialogPanel";
import { useCreateCategory, useUpdateCategory } from "@/hooks/service-catalog";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { slugifyName } from "@/lib/catalog/catalog-validation";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";
import { CatalogCoverField } from "./CatalogCoverField";
import { fieldError, formError } from "./catalog-errors";
import { initialGalleryFromItem, isGalleryDirty } from "./cover-staging";
import { ServiceCategoryBasicFields } from "./ServiceCategoryBasicFields";
import { useDeferredGallerySubmit } from "./useDeferredGallerySubmit";
import { useStagedCovers } from "./useStagedCovers";

export type CategoryDialogState =
  | { mode: "create" }
  | { mode: "edit"; item: ServiceCategoryItem };

type ServiceCategoryDialogProps = {
  dialog: CategoryDialogState | null;
  onClose: () => void;
};

// Create/edit modal for one service category. Cover images are staged as
// local thumbnails (drag-drop multi + per-image crop) and upload only on
// save; the list shows real thumbnails after a successful save.
export function ServiceCategoryDialog({
  dialog,
  onClose,
}: ServiceCategoryDialogProps) {
  const editing = dialog?.mode === "edit" ? dialog.item : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0));
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));
  const [pendingOwnerId] = useState(() => crypto.randomUUID());
  const covers = useStagedCovers(initialGalleryFromItem(editing));

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const saver = useDeferredGallerySubmit({
    staged: covers.staged,
    buildPayload: covers.buildPayload,
    owner: {
      scope: "category",
      ownerType: "category",
      editingId: editing?.id ?? null,
      pendingOwnerId,
    },
    onSave: (gallery, uploaded) => {
      const coverUrl = gallery[0] ?? "";
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        icon: icon.trim(),
        imageUrl: coverUrl,
        imageAssetId: uploaded.find((u) => u.url === coverUrl)?.assetId,
        images: gallery,
        imageAssetIds: uploaded.map((u) => u.assetId),
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
    },
  });
  const pending =
    createMutation.isPending || updateMutation.isPending || saver.uploading;
  const error = createMutation.error ?? updateMutation.error ?? null;

  // Warn on refresh/tab close while anything is unsaved: typed fields,
  // gallery picks, or an upload/save still in flight.
  const dirty =
    pending ||
    name !== (editing?.name ?? "") ||
    slug !== (editing?.slug ?? "") ||
    icon !== (editing?.icon ?? "") ||
    description !== (editing?.description ?? "") ||
    sortOrder !== String(editing?.sortOrder ?? 0) ||
    isGalleryDirty(
      initialGalleryFromItem(editing),
      covers.existing,
      covers.staged.length,
    );
  const guard = useUnsavedChangesGuard(dirty, onClose);

  if (!dialog) return null;

  const submit = () => {
    if (pending) return;
    saver.submit();
  };

  const alert = formError(error, "Không lưu được loại hình.");
  const submitLabel = saver.uploading
    ? "Đang tải ảnh…"
    : pending
      ? "Đang lưu…"
      : editing
        ? "Lưu thay đổi"
        : "Tạo loại hình";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa loại hình" : "Thêm loại hình"}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={guard.requestClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <DialogPanel wide>
        <DialogHeader
          title={editing ? "Sửa loại hình" : "Thêm loại hình"}
          hint="Mỗi loại hình có một mã riêng, dùng để xác nhận khi xóa vĩnh viễn."
          onClose={guard.requestClose}
        />
        <div className="mt-4 flex flex-col gap-5">
          <ServiceCategoryBasicFields
            name={name}
            slug={slug}
            icon={icon}
            slugTouched={slugTouched}
            error={error}
            onName={setName}
            onSlug={setSlug}
            onSlugTouched={() => setSlugTouched(true)}
            onRegenSlug={() => setSlug(slugifyName(name))}
            onIcon={setIcon}
          />
          <CatalogCoverField
            covers={covers}
            disabled={pending}
            serverError={error}
            onFiles={(files) => void covers.addFiles(files)}
          />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Mô tả
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Thay dầu, lọc gió, kiểm tra tổng quát…"
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
        {(alert || saver.uploadError) && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {saver.uploadError ?? alert}
          </p>
        )}
        <DialogFooter
          submitLabel={submitLabel}
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
