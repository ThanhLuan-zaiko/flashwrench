"use client";

import { useState } from "react";
import {
  useHardDeleteStaff,
  useResetStaffPassword,
  useRestoreStaff,
  useSoftDeleteStaff,
} from "@/hooks/admin";
import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import { AuthApiError } from "@/services/admin.api";
import type { StaffDeleteTarget } from "./StaffDeleteDialog";
import type { StaffDialogState } from "./StaffDialog";

function formError(error: unknown): string | null {
  if (error instanceof AuthApiError) return error.errors.form ?? error.message;
  return null;
}

// Staff row actions: create/edit dialog plus soft/restore/hard delete and
// temp-password reissue. Mirrors useCatalogRowActions so both admin
// sections behave alike.
export function useStaffActions() {
  const [pendingStaffId, setPendingStaffId] = useState<string | null>(null);
  const [resetPendingId, setResetPendingId] = useState<string | null>(null);
  const [staffDialog, setStaffDialog] = useState<StaffDialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffDeleteTarget | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const softMutation = useSoftDeleteStaff();
  const restoreMutation = useRestoreStaff();
  const hardMutation = useHardDeleteStaff();
  const resetMutation = useResetStaffPassword();

  const resetDeleteErrors = () => {
    softMutation.reset();
    restoreMutation.reset();
    hardMutation.reset();
  };

  const openCreate = () => setStaffDialog({ mode: "create" });

  const openEdit = (item: AdminUserItem) =>
    setStaffDialog({ mode: "edit", item });

  const closeStaffDialog = () => setStaffDialog(null);

  const openSoft = (item: AdminUserItem) => {
    resetDeleteErrors();
    setDeleteConfirm("");
    setDeleteTarget({
      mode: "soft",
      id: item.id,
      fullName: item.fullName,
      phone: item.phone,
    });
  };

  const openHard = (item: AdminUserItem) => {
    resetDeleteErrors();
    setDeleteConfirm("");
    setDeleteTarget({
      mode: "hard",
      id: item.id,
      fullName: item.fullName,
      phone: item.phone,
    });
  };

  const closeDelete = () => {
    resetDeleteErrors();
    setDeleteTarget(null);
    setDeleteConfirm("");
  };

  const restore = (item: AdminUserItem) => {
    if (restoreMutation.isPending) return;
    resetDeleteErrors();
    setPendingStaffId(item.id);
    restoreMutation.mutate(
      { userId: item.id },
      { onSettled: () => setPendingStaffId(null) },
    );
  };

  const deletePending =
    softMutation.isPending ||
    restoreMutation.isPending ||
    hardMutation.isPending;

  const deleteError =
    formError(softMutation.error) ??
    formError(restoreMutation.error) ??
    formError(hardMutation.error);

  const confirmDelete = () => {
    if (!deleteTarget || deletePending) return;
    setPendingStaffId(deleteTarget.id);
    if (deleteTarget.mode === "soft") {
      softMutation.mutate(
        { userId: deleteTarget.id },
        {
          onSuccess: () => {
            setPendingStaffId(null);
            closeDelete();
          },
          onError: () => setPendingStaffId(null),
        },
      );
      return;
    }
    hardMutation.mutate(
      { userId: deleteTarget.id, confirm: deleteConfirm },
      {
        onSuccess: () => {
          setPendingStaffId(null);
          closeDelete();
        },
        onError: () => setPendingStaffId(null),
      },
    );
  };

  const resetPassword = (item: AdminUserItem) => {
    if (resetMutation.isPending) return;
    resetMutation.reset();
    setResetPendingId(item.id);
    resetMutation.mutate(
      { userId: item.id },
      { onSettled: () => setResetPendingId(null) },
    );
  };

  return {
    pendingStaffId,
    resetPendingId,
    resetError: formError(resetMutation.error),
    resetPassword,
    staffDialog,
    openCreate,
    openEdit,
    closeStaffDialog,
    deleteTarget,
    deleteConfirm,
    setDeleteConfirm,
    openSoft,
    openHard,
    closeDelete,
    restore,
    deletePending,
    deleteError: deleteTarget ? deleteError : null,
    restoreError: formError(restoreMutation.error),
    confirmDelete,
  };
}
