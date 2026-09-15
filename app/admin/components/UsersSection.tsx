"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMe } from "@/hooks/auth";
import { useTransitionComplaint } from "@/hooks/complaints";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { ComplaintItem } from "@/lib/complaints/complaint.types";
import { BentoCard } from "./bento/BentoCard";
import { UsersStatCard } from "./bento/UsersStatCard";
import { AccountManageList } from "./users/AccountManageList";
import { ApprovalQueueList } from "./users/ApprovalQueueList";
import {
  ComplaintDialog,
  type ComplaintDialogState,
} from "./users/ComplaintDialog";
import { ComplaintList } from "./users/ComplaintList";
import { StaffDeleteDialog } from "./users/StaffDeleteDialog";
import { StaffDialog } from "./users/StaffDialog";
import { StaffSection } from "./users/StaffSection";
import { UserActionDialog } from "./users/UserActionDialog";
import { UsersHeaderAction } from "./users/UsersHeaderAction";
import { USER_TABS, type UserTab } from "./users/user-tabs";
import { useStaffActions } from "./users/useStaffActions";
import { useStaffPendingMap } from "./users/useStaffPendingMap";
import { useUserRowActions } from "./users/useUserRowActions";
import { useUsersOverview } from "./users/useUsersOverview";

// Bento root for user management: live stats, tabbed queues, complaint
// handling. Data via useUsersOverview, account actions via
// useUserRowActions, complaint transitions via TanStack mutations.
// Active tab comes from the route (one URL per tab) so links stay
// shareable and the browser back button works. The current admin id
// hides self/admin actions so nobody can lock their own account.
export function UsersSection({ tab }: { tab: UserTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [statusFilter, setStatusFilter] = useState("");
  const [complaintDialog, setComplaintDialog] =
    useState<ComplaintDialogState | null>(null);
  const [complaintBusyId, setComplaintBusyId] = useState<string | null>(null);
  const me = useMe();
  const currentUserId = me.data?.id ?? null;
  const actions = useUserRowActions(currentUserId);
  const staff = useStaffActions();
  const overview = useUsersOverview();
  const staffIds = useMemo(
    () => overview.staffLive.map((u) => u.id),
    [overview.staffLive],
  );
  const pending = useStaffPendingMap(staffIds, tab === "staff");
  const transition = useTransitionComplaint();

  const pendingUsers = useMemo(
    () => overview.pendingQuery.data?.users ?? [],
    [overview.pendingQuery.data],
  );
  const visibleComplaints = useMemo(
    () =>
      overview.complaints.filter((c) =>
        statusFilter ? c.status === statusFilter : true,
      ),
    [overview.complaints, statusFilter],
  );

  const quickReopen = (item: ComplaintItem) => {
    setComplaintBusyId(item.id);
    transition.mutate(
      { id: item.id, action: "reopen" },
      { onSettled: () => setComplaintBusyId(null) },
    );
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Quản lý người dùng"
        title="Đúng người, đúng việc."
        subtitle="Duyệt thợ, khóa tài khoản, quản lý nhân viên và xử lý khiếu nại tại một nơi duy nhất."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {overview.stats.map((stat) => (
          <UsersStatCard key={stat.id} stat={stat} />
        ))}
        <BentoCard
          label="Quản lý tài khoản"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Chọn nhóm quản lý"
              className="flex flex-wrap gap-1.5"
            >
              {USER_TABS.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={`flex min-h-[44px] items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                    tab === t.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <UsersHeaderAction
              tab={tab}
              onCreateComplaint={() => setComplaintDialog({ mode: "create" })}
              onCreateStaff={staff.openCreate}
            />
          </div>

          <div role="tabpanel" className="mt-4">
            {tab === "approve" && (
              <ApprovalQueueList
                items={pendingUsers}
                isPending={overview.pendingQuery.isPending}
                isError={overview.pendingQuery.isError}
                pendingUserId={actions.pendingUserId}
                currentUserId={currentUserId}
                onOpenAction={actions.openAction}
                onRetry={() => void overview.pendingQuery.refetch()}
              />
            )}
            {tab === "lock" && (
              <AccountManageList
                items={overview.allUsers}
                isPending={overview.allQuery.isPending}
                isError={overview.allQuery.isError}
                pendingUserId={actions.pendingUserId}
                currentUserId={currentUserId}
                onOpenAction={actions.openAction}
                onRetry={() => void overview.allQuery.refetch()}
              />
            )}
            {tab === "staff" && (
              <StaffSection
                mode="staff"
                live={overview.staffLive}
                trash={overview.staffTrash}
                isPending={overview.allQuery.isPending}
                isError={overview.allQuery.isError}
                pendingId={staff.pendingStaffId}
                currentUserId={currentUserId}
                restoreError={staff.restoreError}
                pendingMap={pending.pendingMap}
                cryptoConfigured={pending.cryptoConfigured}
                resetPendingId={staff.resetPendingId}
                resetError={staff.resetError}
                onEdit={staff.openEdit}
                onSoft={staff.openSoft}
                onRestore={staff.restore}
                onHard={staff.openHard}
                onResetPassword={staff.resetPassword}
                onRetry={() => void overview.allQuery.refetch()}
              />
            )}
            {tab === "trash" && (
              <StaffSection
                mode="trash"
                live={overview.staffLive}
                trash={overview.staffTrash}
                isPending={overview.allQuery.isPending}
                isError={overview.allQuery.isError}
                pendingId={staff.pendingStaffId}
                currentUserId={currentUserId}
                restoreError={staff.restoreError}
                onEdit={staff.openEdit}
                onSoft={staff.openSoft}
                onRestore={staff.restore}
                onHard={staff.openHard}
                onRetry={() => void overview.allQuery.refetch()}
              />
            )}
            {tab === "complaints" && (
              <ComplaintList
                items={visibleComplaints}
                isPending={overview.complaintsQuery.isPending}
                isError={overview.complaintsQuery.isError}
                busyId={complaintBusyId}
                statusFilter={statusFilter}
                onFilterChange={setStatusFilter}
                onOpenDialog={setComplaintDialog}
                onQuickReopen={quickReopen}
                onRetry={() => void overview.complaintsQuery.refetch()}
              />
            )}
          </div>
        </BentoCard>
      </div>

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
          onClose={() => setComplaintDialog(null)}
        />
      )}
    </div>
  );
}
