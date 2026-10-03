"use client";

import { ComplaintDialog, type ComplaintDialogState } from "./ComplaintDialog";
import { StaffDeleteDialog } from "./StaffDeleteDialog";
import { StaffDialog } from "./StaffDialog";
import { UserActionDialog } from "./UserActionDialog";
import type { useStaffActions } from "./useStaffActions";
import type { useUserRowActions } from "./useUserRowActions";

type UsersDialogsProps = {
  actions: ReturnType<typeof useUserRowActions>;
  staff: ReturnType<typeof useStaffActions>;
  complaintDialog: ComplaintDialogState | null;
  onCloseComplaint: () => void;
};

// All modal dialogs for the user-management section, kept in one place
// so UsersSection only renders lists. Keyed instances reset form state
// on every open.
export function UsersDialogs({
  actions,
  staff,
  complaintDialog,
  onCloseComplaint,
}: UsersDialogsProps) {
  return (
    <>
      <UserActionDialog
        target={actions.actionTarget}
        pending={actions.actionPending}
        error={actions.actionError}
        onClose={actions.closeAction}
        onConfirm={actions.confirmAction}
      />
      {staff.staffDialog && (
        <StaffDialog
          key={
            staff.staffDialog.mode === "edit"
              ? `staff-${staff.staffDialog.item.id}`
              : "staff-create"
          }
          dialog={staff.staffDialog}
          onClose={staff.closeStaffDialog}
        />
      )}
      <StaffDeleteDialog
        target={staff.deleteTarget}
        confirmText={staff.deleteConfirm}
        pending={staff.deletePending}
        error={staff.deleteError}
        onConfirmText={staff.setDeleteConfirm}
        onClose={staff.closeDelete}
        onConfirm={staff.confirmDelete}
      />
      {complaintDialog && (
        <ComplaintDialog
          key={
            complaintDialog.mode === "handle"
              ? `complaint-${complaintDialog.item.id}`
              : "complaint-create"
          }
          dialog={complaintDialog}
          onClose={onCloseComplaint}
        />
      )}
    </>
  );
}
