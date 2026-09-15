"use client";

import type { AdminUserItem } from "@/lib/auth/admin-users.service";
import { StaffManageList } from "./StaffManageList";
import { StaffTrashList } from "./StaffTrashList";

type StaffSectionProps = {
  mode: "staff" | "trash";
  live: AdminUserItem[];
  trash: AdminUserItem[];
  isPending: boolean;
  isError: boolean;
  pendingId: string | null;
  currentUserId: string | null;
  restoreError: string | null;
  onEdit: (item: AdminUserItem) => void;
  onSoft: (item: AdminUserItem) => void;
  onRestore: (item: AdminUserItem) => void;
  onHard: (item: AdminUserItem) => void;
  onRetry: () => void;
};

const TRASH_GROUPS = [
  { role: "mechanic", label: "Thợ đã xóa mềm" },
  { role: "dispatcher", label: "Điều phối đã xóa mềm" },
  { role: "customer", label: "Khách hàng đã xóa mềm" },
] as const;

// Staff tab content split by route like the catalog: "staff" shows live
// accounts with create/edit/soft-delete, "trash" groups soft-deleted rows
// by role with restore/hard-delete, mirroring CatalogTrashPanel.
// Extracted to keep UsersSection small.
export function StaffSection({
  mode,
  live,
  trash,
  isPending,
  isError,
  pendingId,
  currentUserId,
  restoreError,
  onEdit,
  onSoft,
  onRestore,
  onHard,
  onRetry,
}: StaffSectionProps) {
  if (mode === "trash") {
    return (
      <div className="flex flex-col gap-6">
        {restoreError && (
          <p
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {restoreError}
          </p>
        )}
        {TRASH_GROUPS.map((group) => {
          const rows = trash.filter((u) => u.role === group.role);
          return (
            <section
              key={group.role}
              aria-label={`${group.label} (${rows.length})`}
            >
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {group.label} ({rows.length})
              </h3>
              <div className="mt-2">
                <StaffTrashList
                  items={rows}
                  isPending={isPending}
                  isError={isError}
                  pendingId={pendingId}
                  currentUserId={currentUserId}
                  onRestore={onRestore}
                  onHard={onHard}
                  onRetry={onRetry}
                />
              </div>
            </section>
          );
        })}
      </div>
    );
  }
  return (
    <StaffManageList
      items={live}
      isPending={isPending}
      isError={isError}
      pendingId={pendingId}
      currentUserId={currentUserId}
      onEdit={onEdit}
      onSoft={onSoft}
      onRetry={onRetry}
    />
  );
}
