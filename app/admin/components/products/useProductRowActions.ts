"use client";

import { useState } from "react";
import {
  useHardDeletePart,
  useHardDeletePartCategory,
  useRestorePart,
  useRestorePartCategory,
  useSoftDeletePart,
  useSoftDeletePartCategory,
  useTogglePartActive,
  useTogglePartCategoryActive,
} from "@/hooks/admin-parts";
import type { PartCategoryItem, PartItem } from "@/lib/parts/parts.types";
import { AuthApiError } from "@/services/auth.api";

export type PartDeleteTarget = {
  kind: "category" | "part";
  mode: "soft" | "hard";
  id: string;
  name: string;
  slug: string;
  detail?: string;
};

function formError(error: unknown): string | null {
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return errors.form ?? errors.confirm ?? error.message;
  }
  return null;
}

// Row actions own toggle/restore plus the soft/hard delete dialog state.
// ProductsSection stays a thin grid root under the 250-line limit.
export function useProductRowActions() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartDeleteTarget | null>(
    null,
  );
  const [confirmText, setConfirmText] = useState("");

  const toggleCategory = useTogglePartCategoryActive();
  const softCategory = useSoftDeletePartCategory();
  const restoreCategoryMutation = useRestorePartCategory();
  const hardCategory = useHardDeletePartCategory();

  const togglePart = useTogglePartActive();
  const softPart = useSoftDeletePart();
  const restorePartMutation = useRestorePart();
  const hardPart = useHardDeletePart();

  const resetDeleteErrors = () => {
    softCategory.reset();
    hardCategory.reset();
    softPart.reset();
    hardPart.reset();
  };

  const runWithPending = (id: string, task: (done: () => void) => void) => {
    setPendingId(id);
    task(() => setPendingId(null));
  };

  const toggleCategoryRow = (item: PartCategoryItem) =>
    runWithPending(item.id, (done) =>
      toggleCategory.mutate(
        { id: item.id, isActive: !item.isActive },
        { onSettled: done },
      ),
    );

  const restoreCategory = (item: PartCategoryItem) =>
    runWithPending(item.id, (done) =>
      restoreCategoryMutation.mutate(item.id, { onSettled: done }),
    );

  const togglePartRow = (item: PartItem) =>
    runWithPending(item.id, (done) =>
      togglePart.mutate(
        { id: item.id, isActive: !item.isActive },
        { onSettled: done },
      ),
    );

  const restorePart = (item: PartItem) =>
    runWithPending(item.id, (done) =>
      restorePartMutation.mutate(item.id, { onSettled: done }),
    );

  const openSoft = (
    kind: PartDeleteTarget["kind"],
    item: PartCategoryItem | PartItem,
  ) => {
    resetDeleteErrors();
    setConfirmText("");
    setDeleteTarget({
      kind,
      mode: "soft",
      id: item.id,
      name: item.name,
      slug: item.slug,
    });
  };

  const openHard = (
    kind: PartDeleteTarget["kind"],
    item: PartCategoryItem | PartItem,
  ) => {
    resetDeleteErrors();
    setConfirmText("");
    setDeleteTarget({
      kind,
      mode: "hard",
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

  const deletePending =
    softCategory.isPending ||
    hardCategory.isPending ||
    softPart.isPending ||
    hardPart.isPending;

  const deleteError =
    formError(softCategory.error) ??
    formError(hardCategory.error) ??
    formError(softPart.error) ??
    formError(hardPart.error);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const done = () => {
      setPendingId(null);
      setDeleteTarget(null);
      setConfirmText("");
    };
    const onError = () => setPendingId(null);
    setPendingId(deleteTarget.id);
    if (deleteTarget.kind === "category") {
      if (deleteTarget.mode === "soft") {
        softCategory.mutate(deleteTarget.id, {
          onSuccess: done,
          onError,
        });
      } else {
        hardCategory.mutate(
          { id: deleteTarget.id, confirm: confirmText },
          { onSuccess: done, onError },
        );
      }
      return;
    }
    if (deleteTarget.mode === "soft") {
      softPart.mutate(deleteTarget.id, { onSuccess: done, onError });
    } else {
      hardPart.mutate(
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
    toggleCategory: toggleCategoryRow,
    restoreCategory,
    togglePart: togglePartRow,
    restorePart,
    openSoft,
    openHard,
    confirmDelete,
  };
}
