"use client";

import { useEffect, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { DialogFooter } from "@/components/ui/DialogFooter";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { DialogPanel } from "@/components/ui/DialogPanel";
import { DIALOG_OVERLAY_CLASSES } from "@/components/ui/dialog-overlay";
import { useCreatePart, useUpdatePart } from "@/hooks/admin-parts";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import type { PartCategoryItem, PartItem } from "@/lib/parts/parts.types";
import { CatalogCoverField } from "../services/CatalogCoverField";
import { formError } from "../services/catalog-errors";
import {
  initialGalleryFromItem,
  isGalleryDirty,
} from "../services/cover-staging";
import { useDeferredGallerySubmit } from "../services/useDeferredGallerySubmit";
import { useStagedCovers } from "../services/useStagedCovers";
import { PartBasicFields } from "./PartBasicFields";
import { PartExtraFields } from "./PartExtraFields";
import { PartPricingFields } from "./PartPricingFields";
import {
  buildPartPayload,
  csvToText,
  isPartFormDirty,
  partSubmitLabel,
  specsToText,
} from "./part-form-utils";

export type PartDialogState =
  | { mode: "create"; presetCategoryId?: string }
  | { mode: "edit"; item: PartItem };

type PartDialogProps = {
  dialog: PartDialogState | null;
  categories: PartCategoryItem[];
  onClose: () => void;
};

// Create/edit modal for one shop part. Parent passes a keyed instance so
// form state resets on every open. The category default still syncs via
// effect because the category list can arrive after the dialog mounts.
// Covers are staged as local thumbnails and upload only on save (scope
// "part", owner = part id or the pending pre-generated id).
export function PartDialog({ dialog, categories, onClose }: PartDialogProps) {
  const editing = dialog?.mode === "edit" ? dialog.item : null;
  const preset =
    dialog?.mode === "create" ? (dialog.presetCategoryId ?? "") : "";
  const live = categories.filter((c) => !c.isDeleted);
  const liveFirstId = live[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ?? preset ?? liveFirstId,
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [sku, setSku] = useState(editing?.sku ?? "");
  const [brand, setBrand] = useState(editing?.brand ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? ""));
  const [comparePrice, setComparePrice] = useState(
    editing?.comparePrice ? String(editing.comparePrice) : "",
  );
  const [stockQty, setStockQty] = useState(String(editing?.stockQty ?? 0));
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [carBrands, setCarBrands] = useState(
    csvToText(editing?.carBrands ?? []),
  );
  const [carModels, setCarModels] = useState(
    csvToText(editing?.carModels ?? []),
  );
  const [specsText, setSpecsText] = useState(specsToText(editing?.specs ?? {}));
  const [description, setDescription] = useState(editing?.description ?? "");
  const [pendingOwnerId] = useState(() => crypto.randomUUID());
  const covers = useStagedCovers(initialGalleryFromItem(editing));

  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const saver = useDeferredGallerySubmit({
    staged: covers.staged,
    buildPayload: covers.buildPayload,
    owner: {
      scope: "part",
      ownerType: "part",
      editingId: editing?.id ?? null,
      pendingOwnerId,
    },
    onSave: (gallery, uploaded) => {
      const payload = buildPartPayload(
        fields,
        gallery,
        uploaded.map((u) => u.assetId),
      );
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

  const fields = {
    categoryId,
    name,
    slug,
    sku,
    brand,
    price,
    comparePrice,
    stockQty,
    carBrands,
    carModels,
    specsText,
    description,
    isActive,
  };
  const dirty = isPartFormDirty(
    fields,
    editing,
    preset || liveFirstId,
    isGalleryDirty(
      initialGalleryFromItem(editing),
      covers.existing,
      covers.staged.length,
    ),
    pending,
  );
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

  const alert = formError(error, "Không lưu được sản phẩm.");
  const submitLabel = partSubmitLabel(
    saver.uploading,
    pending,
    Boolean(editing),
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
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
          title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
          hint="Giá tính bằng VND, slug dùng để xác nhận khi xóa vĩnh viễn."
          onClose={guard.requestClose}
        />

        <div className="mt-4 flex flex-col gap-5">
          <PartBasicFields
            editing={Boolean(editing)}
            categoryId={categoryId}
            categories={live}
            name={name}
            slug={slug}
            sku={sku}
            brand={brand}
            error={error}
            hasNoCategories={hasNoCategories}
            onCategoryId={setCategoryId}
            onName={setName}
            onSlug={setSlug}
            onSku={setSku}
            onBrand={setBrand}
          />
          <CatalogCoverField
            covers={covers}
            disabled={pending}
            serverError={error}
            onFiles={(files) => void covers.addFiles(files)}
          />
          <PartPricingFields
            price={price}
            comparePrice={comparePrice}
            stockQty={stockQty}
            isActive={isActive}
            error={error}
            onPrice={setPrice}
            onComparePrice={setComparePrice}
            onStockQty={setStockQty}
            onActive={setIsActive}
          />
          <PartExtraFields
            carBrands={carBrands}
            carModels={carModels}
            specsText={specsText}
            description={description}
            error={error}
            onCarBrands={setCarBrands}
            onCarModels={setCarModels}
            onSpecsText={setSpecsText}
            onDescription={setDescription}
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
