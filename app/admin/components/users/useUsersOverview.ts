"use client";

import { useMemo } from "react";
import { FiInbox, FiLock, FiUserCheck, FiUsers } from "react-icons/fi";
import { useAdminUsers } from "@/hooks/admin";
import { useComplaints } from "@/hooks/complaints";
import type { UsersStat } from "../bento/UsersStatCard";

// Live overview: one query per aggregate plus derived stat cards.
// Mirrors useCatalogOverview so both admin sections read the same way.
export function useUsersOverview() {
  const pendingQuery = useAdminUsers({
    role: "mechanic",
    status: "pending_verification",
  });
  const allQuery = useAdminUsers({ role: "all" });
  const complaintsQuery = useComplaints();

  const allUsers = useMemo(() => allQuery.data?.users ?? [], [allQuery.data]);
  const complaints = useMemo(
    () => complaintsQuery.data?.complaints ?? [],
    [complaintsQuery.data],
  );
  const pendingCount = pendingQuery.data?.users.length ?? 0;
  const lockedCount = useMemo(
    () => allUsers.filter((u) => u.status === "locked").length,
    [allUsers],
  );
  const openComplaints = useMemo(
    () =>
      complaints.filter((c) => c.status === "open" || c.status === "in_review"),
    [complaints],
  );

  const stats: UsersStat[] = [
    {
      id: "pending",
      label: "Chờ duyệt",
      value: pendingQuery.isPending ? "…" : String(pendingCount),
      hint: "Hồ sơ thợ mới",
      icon: FiUserCheck,
    },
    {
      id: "total",
      label: "Tổng tài khoản",
      value: allQuery.isPending ? "…" : String(allUsers.length),
      hint: "Mọi vai trò",
      icon: FiUsers,
    },
    {
      id: "locked",
      label: "Đang bị khóa",
      value: allQuery.isPending ? "…" : String(lockedCount),
      hint: "Cần rà soát",
      icon: FiLock,
    },
    {
      id: "complaints",
      label: "Khiếu nại mở",
      value: complaintsQuery.isPending ? "…" : String(openComplaints.length),
      hint: `Đã xong: ${complaints.length - openComplaints.length}`,
      icon: FiInbox,
    },
  ];

  return {
    pendingQuery,
    allQuery,
    complaintsQuery,
    allUsers,
    complaints,
    openComplaints,
    stats,
  };
}
