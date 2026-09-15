"use client";

import { useState } from "react";
import {
  useHardDeleteCategory,
  useHardDeleteService,
  usePatchCategory,
  usePatchService,
} from "@/hooks/service-catalog";
import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import { AuthApiError } from "@/services/service-catalog.api";
import type { DeleteTarget } from "./CatalogDeleteDialog";

function formError(error: unknown): string | null {
  if (error instanceof AuthApiError) return error.errors.form ?? error.message;
  return null;
}

// Row actions own toggle/restore plus the soft/hard delete dialog state.
// ServicesSection stays a thin grid root under the 250-line limit.
export function useCatalogRowActions() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const patchCategory = usePatchCategory();
  const hardDeleteCategory = useHardDeleteCategory();
  const patchService = usePatchService();
  const hardDeleteService = useHardDeleteService();

  const runWithPending = (id: string, task: (done: () => void) => void) => {
    setPendingId(id);
    task(() => setPendingId(null));
  };

  const toggleCategory = (item: ServiceCategoryItem) =>
    runWithPending(item.id, (done) =>
      patchCategory.mutate(
        { id: item.id, action: "toggle", isActive: !item.isActive },
        { onSettled: done },
      ),
    );

  const restoreCategory = (item: ServiceCategoryItem) =>
    runWithPending(item.id, (done) =>
      patchCategory.mutate(
        { id: item.id, action: "restore" },
        { onSettled: done },
      ),
    );

  const toggleService = (item: ServiceItem) =>
    runWithPending(item.id, (done) =>
      patchService.mutate(
        { id: item.id, action: "toggle", isActive: !item.isActive },
        { onSettled: done },
      ),
    );

  const restoreService = (item: ServiceItem) =>
    runWithPending(item.id, (done) =>
      patchService.mutate(
        { id: item.id, action: "restore" },
        { onSettled: done },
      ),
    );

  const openSoft = (
    kind: DeleteTarget["kind"],
    item: ServiceCategoryItem | ServiceItem,
  ) => {
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
    kind: DeleteTarget["kind"],
    item: ServiceCategoryItem | ServiceItem,
  ) => {
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
    setDeleteTarget(null);
    setConfirmText("");
  };

  const deletePending =
    patchCategory.isPending ||
    hardDeleteCategory.isPending ||
    patchService.isPending ||
    hardDeleteService.isPending;

  const deleteError =
    formError(patchCategory.error) ??
    formError(hardDeleteCategory.error) ??
    formError(patchService.error) ??
    formError(hardDeleteService.error);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const done = () => {
      setPendingId(null);
      setDeleteTarget(null);
      setConfirmText("");
    };
    const onHardError = () => setPendingId(null);
    setPendingId(deleteTarget.id);
    if (deleteTarget.kind === "category") {
      if (deleteTarget.mode === "soft") {
        patchCategory.mutate(
          { id: deleteTarget.id, action: "soft" },
          { onSettled: done },
        );
      } else {
        hardDeleteCategory.mutate(
          { id: deleteTarget.id, confirm: confirmText },
          { onSuccess: done, onError: onHardError },
        );
      }
      return;
    }
    if (deleteTarget.mode === "soft") {
      patchService.mutate(
        { id: deleteTarget.id, action: "soft" },
        { onSettled: done },
      );
    } else {
      hardDeleteService.mutate(
        { id: deleteTarget.id, confirm: confirmText },
        { onSuccess: done, onError: onHardError },
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
    toggleCategory,
    restoreCategory,
    toggleService,
    restoreService,
    openSoft,
    openHard,
    confirmDelete,
  };
}
