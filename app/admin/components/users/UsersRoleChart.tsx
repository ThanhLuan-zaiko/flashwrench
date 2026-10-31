"use client";

import { swatchClass } from "@/components/charts/chart-palette";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useAdminUsers } from "@/hooks/admin";
import { useComplaints } from "@/hooks/complaints";
import { groupTotals } from "@/lib/staff-charts/page-series";

const ROLE_LABELS: Record<string, string> = {
  customer: "Khách hàng",
  mechanic: "Thợ",
  dispatcher: "Điều phối",
  admin: "Quản trị",
};

// Live accounts split by role, plus open complaints. Reuses the users
// overview queries (same keys), so approvals and locks redraw in place.
export function UsersRoleChart() {
  const users = useAdminUsers({ role: "all" });
  const complaints = useComplaints();
  const live = (users.data?.users ?? []).filter(
    (user) => (user.status as string) !== "deleted",
  );
  const roles = groupTotals(
    live,
    (user) => user.role,
    (user) => ROLE_LABELS[user.role] ?? user.role,
  );
  const openComplaints = (complaints.data?.complaints ?? []).filter(
    (item) => item.status === "open" || item.status === "in_review",
  ).length;

  return (
    <StaffChartCard
      title="Tài khoản theo vai trò"
      subtitle={`${openComplaints} khiếu nại đang mở`}
      isPending={users.isPending}
      empty={users.isError ? "Không tải được danh sách tài khoản." : null}
      aside={<ChartHeadline value={String(live.length)} caption="tài khoản" />}
    >
      <StackedBarChart
        values={roles.map((role) => role.value)}
        label={roles.map((role) => `${role.label}: ${role.value}`).join("; ")}
        className="h-6 w-full"
      />
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {roles.map((role, index) => (
          <li
            key={role.key}
            className="flex items-center gap-2 py-1 text-xs text-zinc-700 dark:text-zinc-300"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-sm ${swatchClass(index)}`}
            />
            <span className="flex-1 truncate">{role.label}</span>
            <b className="text-[#1E3A5F] tabular-nums dark:text-zinc-50">
              {role.value}
            </b>
          </li>
        ))}
      </ul>
    </StaffChartCard>
  );
}
