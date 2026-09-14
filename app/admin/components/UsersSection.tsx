"use client";

import { useState } from "react";
import { FiInbox, FiLock, FiUserCheck, FiUsers } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useAdminUsers } from "@/hooks/admin";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { AccountLockList } from "./AccountLockList";
import { BentoCard } from "./bento/BentoCard";
import { UsersHeroCard } from "./bento/UsersHeroCard";
import { type UsersStat, UsersStatCard } from "./bento/UsersStatCard";
import { USER_TABS, type UserTabId } from "./bento/users-tabs";
import { MechanicApprovalList } from "./MechanicApprovalList";

function formatCount(value: number | undefined, pending: boolean): string {
  if (pending) return "…";
  return String(value ?? 0);
}

// Bento overview: big type statement, hero tabs plus live counts,
// list spans full width.
export function UsersSection() {
  const [tab, setTab] = useState<UserTabId>("approve");
  const rootRef = useBentoReveal<HTMLDivElement>();
  const pendingQuery = useAdminUsers({
    role: "mechanic",
    status: "pending_verification",
  });
  const allQuery = useAdminUsers({ role: "all" });

  const allUsers = allQuery.data?.users ?? [];
  const lockedCount = allUsers.filter((u) => u.status === "locked").length;
  const current = USER_TABS.find((t) => t.id === tab) ?? USER_TABS[0];

  const stats: UsersStat[] = [
    {
      id: "pending",
      label: "Chờ duyệt",
      value: formatCount(
        pendingQuery.data?.users.length,
        pendingQuery.isPending,
      ),
      hint: "Hồ sơ thợ mới",
      icon: FiUserCheck,
    },
    {
      id: "total",
      label: "Tổng tài khoản",
      value: formatCount(allQuery.data?.users.length, allQuery.isPending),
      hint: "Mọi vai trò",
      icon: FiUsers,
    },
    {
      id: "locked",
      label: "Đang bị khóa",
      value: formatCount(lockedCount, allQuery.isPending),
      hint: "Cần rà soát",
      icon: FiLock,
    },
    {
      id: "complaints",
      label: "Khiếu nại",
      value: "0",
      hint: "Tính năng sắp ra mắt",
      icon: FiInbox,
    },
  ];

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Quản lý người dùng"
        title="Đúng người, đúng việc."
        subtitle="Duyệt thợ, khóa tài khoản và xử lý khiếu nại tại một nơi duy nhất."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <UsersHeroCard active={tab} onChange={setTab} />
        {stats.map((stat) => (
          <UsersStatCard key={stat.id} stat={stat} />
        ))}
        <BentoCard
          label={current.label}
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {current.label}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {current.hint}
            </p>
          </div>
          <div role="tabpanel" className="mt-3">
            {tab === "approve" && <MechanicApprovalList />}
            {tab === "lock" && <AccountLockList />}
            {tab === "complaints" && (
              <div className="rounded-xl bg-zinc-100 px-4 py-10 text-center dark:bg-zinc-900">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  Tính năng khiếu nại đang phát triển.
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
                  Khiếu nại từ khách hàng về booking, cứu hộ hoặc đơn hàng sẽ
                  hiện tại đây khi API khiếu nại hoàn thiện.
                </p>
              </div>
            )}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
