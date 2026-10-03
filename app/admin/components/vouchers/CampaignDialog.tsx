"use client";

import { useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { DialogFooter } from "@/components/ui/DialogFooter";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { DialogPanel } from "@/components/ui/DialogPanel";
import { DIALOG_OVERLAY_CLASSES } from "@/components/ui/dialog-overlay";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useCreateCampaign, useUpdateCampaign } from "@/hooks/useVouchers";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";
import {
  MAX_CAMPAIGN_IMAGES,
  voucherCodeFromSlug,
} from "@/lib/vouchers/voucher-validation";
import { CatalogCoverField } from "../services/CatalogCoverField";
import { formError } from "../services/catalog-errors";
import { isGalleryDirty } from "../services/cover-staging";
import { useDeferredGallerySubmit } from "../services/useDeferredGallerySubmit";
import { useStagedCovers } from "../services/useStagedCovers";
import { CampaignIdentityFields } from "./CampaignIdentityFields";
import { CampaignLivePreview } from "./CampaignLivePreview";
import { CampaignRuleFields } from "./CampaignRuleFields";
import {
  type CampaignFormState,
  EMPTY_CAMPAIGN_FORM,
  formDirty,
  formFromCampaign,
  formToPayload,
} from "./campaign-form";

export type CampaignDialogState =
  | { mode: "create" }
  | { mode: "edit"; item: VoucherCampaign };

type CampaignDialogProps = {
  dialog: CampaignDialogState | null;
  onClose: () => void;
};

// Create/edit modal for one voucher campaign, same chrome as the catalog
// dialogs. The code doubles as identity: it is locked once created. The
// gallery follows the deferred contract — local previews first, the blobs
// only upload on save under the "promotion" scope.
export function CampaignDialog({ dialog, onClose }: CampaignDialogProps) {
  const editing = dialog?.mode === "edit" ? dialog.item : null;
  const baseline = editing ? formFromCampaign(editing) : EMPTY_CAMPAIGN_FORM;
  const initialGallery = editing?.images?.length
    ? editing.images
    : editing?.imageUrl
      ? [editing.imageUrl]
      : [];
  const [form, setForm] = useState<CampaignFormState>(baseline);
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));
  const [pendingOwnerId] = useState(() => crypto.randomUUID());
  const covers = useStagedCovers(initialGallery, MAX_CAMPAIGN_IMAGES);

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const saver = useDeferredGallerySubmit({
    staged: covers.staged,
    buildPayload: covers.buildPayload,
    owner: {
      scope: "promotion",
      ownerType: "promotion",
      editingId: editing?.id ?? null,
      pendingOwnerId,
    },
    onSave: (gallery, uploaded) => {
      const payload = formToPayload(
        form,
        gallery,
        uploaded.map((u) => u.assetId),
      );
      if (editing) {
        updateMutation.mutate(
          { id: editing.id, input: payload },
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

  const dirty =
    pending ||
    formDirty(form, baseline) ||
    isGalleryDirty(initialGallery, covers.existing, covers.staged.length);
  const guard = useUnsavedChangesGuard(dirty, onClose);

  if (!dialog) return null;

  const set = <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (pending) return;
    saver.submit();
  };

  const submitLabel = saver.uploading
    ? "Đang tải ảnh…"
    : pending
      ? "Đang lưu…"
      : editing
        ? "Lưu thay đổi"
        : "Tạo chiến dịch";
  const alert =
    saver.uploadError ?? formError(error, "Không lưu được chiến dịch.");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa chiến dịch" : "Thêm chiến dịch"}
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
          title={editing ? "Sửa chiến dịch" : "Thêm chiến dịch"}
          hint="Voucher phát vào ví gắn tài khoản — slug và mã không đổi được sau khi tạo."
          onClose={guard.requestClose}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampaignIdentityFields
            form={form}
            editing={Boolean(editing)}
            error={error}
            slugTouched={slugTouched}
            codePreview={
              editing
                ? editing.code
                : form.slug
                  ? voucherCodeFromSlug(form.slug.trim().toLowerCase())
                  : ""
            }
            onSet={set}
            onSlugTouched={() => setSlugTouched(true)}
          />
          <CampaignRuleFields
            form={form}
            editing={Boolean(editing)}
            error={error}
            onSet={set}
          />
          <div className="sm:col-span-2">
            <CatalogCoverField
              covers={covers}
              disabled={pending}
              serverError={error}
              onFiles={(files) => void covers.addFiles(files)}
              label="Ảnh chiến dịch (tối đa 5 ảnh)"
              hint="Ảnh đầu tiên làm ảnh bìa. Ảnh chỉ tải lên khi bấm lưu. Bấm cắt để sửa ảnh chờ trước khi lưu."
            />
          </div>
          <CampaignLivePreview
            form={form}
            gallery={[
              ...covers.existing,
              ...covers.staged.map((item) => item.previewUrl),
            ]}
          />
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
