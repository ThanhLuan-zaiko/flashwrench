"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiPlus, FiShield } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
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
import { UserActionDialog } from "./users/UserActionDialog";
import { USER_TABS, type UserTab } from "./users/user-tabs";
import { useUserRowActions } from "./users/useUserRowActions";
import { useUsersOverview } from "./users/useUsersOverview";

// Bento root for user management: live stats, tabbed queues, complaint
// handling. Data via useUsersOverview, account actions via
// useUserRowActions, complaint transitions via TanStack mutations.
// Active tab comes from the route (one URL per tab) so links stay
// shareable and the browser back button works.
export function UsersSection({ tab }: { tab: UserTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [statusFilter, setStatusFilter] = useState("");
  const [complaintDialog, setComplaintDialog] =
    useState<ComplaintDialogState | null>(null);
  const [complaintBusyId, setComplaintBusyId] = useState<string | null>(null);
  const actions = useUserRowActions();
  const overview = useUsersOverview();
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
        subtitle="Duyệt thợ, khóa tài khoản và xử lý khiếu nại tại một nơi duy nhất."
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
            {tab === "complaints" ? (
              <button
                type="button"
                onClick={() => setComplaintDialog({ mode: "create" })}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <FiPlus aria-hidden="true" className="h-4 w-4" />
                Ghi nhận khiếu nại
              </button>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <FiShield aria-hidden="true" className="h-4 w-4" />
                Mọi thao tác đều cần xác nhận
              </p>
            )}
          </div>

          <div role="tabpanel" className="mt-4">
            {tab === "approve" && (
              <ApprovalQueueList
                items={pendingUsers}
                isPending={overview.pendingQuery.isPending}
                isError={overview.pendingQuery.isError}
                pendingUserId={actions.pendingUserId}
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
                onOpenAction={actions.openAction}
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
