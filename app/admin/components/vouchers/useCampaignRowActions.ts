"use client";

import { useState } from "react";
import {
  useHardDeleteCampaign,
  useRestoreCampaign,
  useSoftDeleteCampaign,
  useToggleCampaign,
} from "@/hooks/useVouchers";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";
import { AuthApiError } from "@/services/auth.api";

export type CampaignDeleteTarget = {
  mode: "soft" | "hard";
  id: string;
  name: string;
  slug: string;
};

function formError(error: unknown): string | null {
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return errors.form ?? errors.confirm ?? error.message;
  }
  return null;
}

// Row actions own toggle/restore plus the soft/hard delete dialog state —
// the same lifecycle shape as useProductRowActions, single-entity version.
export function useCampaignRowActions() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignDeleteTarget | null>(
    null,
  );
  const [confirmText, setConfirmText] = useState("");

  const toggle = useToggleCampaign();
  const softDelete = useSoftDeleteCampaign();
  const restore = useRestoreCampaign();
  const hardDelete = useHardDeleteCampaign();

  const resetDeleteErrors = () => {
    softDelete.reset();
    hardDelete.reset();
  };

  const runWithPending = (id: string, task: (done: () => void) => void) => {
    setPendingId(id);
    task(() => setPendingId(null));
  };

  const toggleCampaign = (item: VoucherCampaign) =>
    runWithPending(item.id, (done) =>
      toggle.mutate(
        { id: item.id, isActive: !item.isActive },
        { onSettled: done },
      ),
    );

  const restoreCampaign = (item: VoucherCampaign) =>
    runWithPending(item.id, (done) =>
      restore.mutate(item.id, { onSettled: done }),
    );

  const openDelete = (mode: "soft" | "hard", item: VoucherCampaign) => {
    resetDeleteErrors();
    setConfirmText("");
    setDeleteTarget({
      mode,
      id: item.id,
      name: item.name,
      slug: item.slug,
    });
  };

  const closeDelete = () => {
    resetDeleteErrors();
    setDeleteTarget(null);
    setConfirmText("");
  };

  const deletePending = softDelete.isPending || hardDelete.isPending;

  const deleteError =
    formError(softDelete.error) ?? formError(hardDelete.error);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const done = () => {
      setPendingId(null);
      setDeleteTarget(null);
      setConfirmText("");
    };
    const onError = () => setPendingId(null);
    setPendingId(deleteTarget.id);
    if (deleteTarget.mode === "soft") {
      softDelete.mutate(deleteTarget.id, { onSuccess: done, onError });
    } else {
      hardDelete.mutate(
        { id: deleteTarget.id, confirm: confirmText },
        { onSuccess: done, onError },
      );
    }
  };

  return {
    pendingId,
    deleteTarget,
    confirmText,
    setConfirmText,
    closeDelete,
    deletePending,
    deleteError,
    toggleCampaign,
    restoreCampaign,
    openSoft: (item: VoucherCampaign) => openDelete("soft", item),
    openHard: (item: VoucherCampaign) => openDelete("hard", item),
    confirmDelete,
  };
}
