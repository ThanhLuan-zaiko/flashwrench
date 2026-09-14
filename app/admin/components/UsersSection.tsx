"use client";

import { useState } from "react";
import { FiInbox, FiUserCheck, FiUserX } from "react-icons/fi";
import { AccountLockList } from "./AccountLockList";
import { MechanicApprovalList } from "./MechanicApprovalList";

type UserTabId = "approve" | "lock" | "complaints";

const TABS: { id: UserTabId; label: string }[] = [
  { id: "approve", label: "Duyệt thợ" },
  { id: "lock", label: "Khóa tài khoản" },
  { id: "complaints", label: "Khiếu nại" },
];

export function UsersSection() {
  const [tab, setTab] = useState<UserTabId>("approve");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Nhóm chức năng quản lý người dùng"
        className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {TABS.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                selected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {t.id === "approve" && (
                <FiUserCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              {t.id === "lock" && (
                <FiUserX aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              {t.id === "complaints" && (
                <FiInbox aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {tab === "approve" && <MechanicApprovalList />}
        {tab === "lock" && <AccountLockList />}
        {tab === "complaints" && (
          <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Tính năng khiếu nại đang phát triển.
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
              Khiếu nại từ khách hàng về booking, cứu hộ hoặc đơn hàng sẽ hiện
              tại đây khi API khiếu nại hoàn thiện.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
