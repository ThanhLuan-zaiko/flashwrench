"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { DialogFooter } from "@/components/ui/DialogFooter";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { DialogPanel } from "@/components/ui/DialogPanel";
import { DIALOG_OVERLAY_CLASSES } from "@/components/ui/dialog-overlay";
import { useCreateService, useUpdateService } from "@/hooks/service-catalog";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import type {
  PriceUnit,
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import { CatalogCoverField } from "./CatalogCoverField";
import { fieldError, formError } from "./catalog-errors";
import { initialGalleryFromItem } from "./cover-staging";
import { ServiceItemBasicFields } from "./ServiceItemBasicFields";
import { ServiceItemPricingFields } from "./ServiceItemPricingFields";
import { ServiceItemSupportFields } from "./ServiceItemSupportFields";
import { isServiceItemDirty } from "./service-item-dirty";
import {
  buildServiceItemPayload,
  type ServiceItemFormFields,
} from "./service-item-payload";
import { useDeferredGallerySubmit } from "./useDeferredGallerySubmit";
import { useStagedCovers } from "./useStagedCovers";

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
// Covers are staged as local thumbnails and upload only on save.
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
  const [pendingOwnerId] = useState(() => crypto.randomUUID());
  const covers = useStagedCovers(initialGalleryFromItem(editing));

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const saver = useDeferredGallerySubmit({
    staged: covers.staged,
    buildPayload: covers.buildPayload,
    owner: {
      scope: "service",
      ownerType: "service",
      editingId: editing?.id ?? null,
      pendingOwnerId,
    },
    onSave: (gallery, uploaded) => {
      const payload = buildServiceItemPayload(fields, gallery, uploaded);
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
  const hasNoCategories = !editing && live.length === 0;

  // Warn on refresh/tab close while anything is unsaved: typed fields,
  // toggles, gallery picks, or an upload/save still in flight.
  const fields: ServiceItemFormFields = {
    categoryId,
    name,
    slug,
    description,
    basePrice,
    priceUnit,
    durationMin,
    isHomeSupported,
    isEmergencySupported,
    isActive: editing?.isActive ?? true,
  };
  const dirty = isServiceItemDirty({
    editing,
    preset,
    liveFirstId,
    draft: fields,
    existing: covers.existing,
    stagedCount: covers.staged.length,
    pending,
  });
  const guard = useUnsavedChangesGuard(dirty, onClose);

  useEffect(() => {
    if (editing || live.length === 0) return;
    if (!categoryId || !live.some((c) => c.id === categoryId)) {
      if (liveFirstId) setCategoryId(liveFirstId);
    }
  }, [editing, categoryId, live, liveFirstId]);

  if (!dialog) return null;

  const submit = () => {
    if (pending || (!editing && !categoryId)) return;
    saver.submit();
  };

  const alert = formError(error, "Không lưu được mục giá.");
  const submitLabel = saver.uploading
    ? "Đang tải ảnh…"
    : pending
      ? "Đang lưu…"
      : editing
        ? "Lưu thay đổi"
        : "Tạo mục giá";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa mục giá" : "Thêm mục giá"}
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
          title={editing ? "Sửa mục giá" : "Thêm mục giá"}
          hint="Giá tính bằng VND, mã riêng dùng để xác nhận khi xóa vĩnh viễn."
          onClose={guard.requestClose}
        />

        <div className="mt-4 flex flex-col gap-5">
          <ServiceItemBasicFields
            editing={Boolean(editing)}
            categoryId={categoryId}
            categories={live}
            name={name}
            slug={slug}
            error={error}
            hasNoCategories={hasNoCategories}
            onCategoryId={setCategoryId}
            onName={setName}
            onSlug={setSlug}
          />
          <CatalogCoverField
            covers={covers}
            disabled={pending}
            serverError={error}
            onFiles={(files) => void covers.addFiles(files)}
          />
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
          submitDisabled={!editing && !categoryId}
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
