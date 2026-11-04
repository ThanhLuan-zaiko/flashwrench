"use client";

import Link from "next/link";
import { FiPieChart, FiPlus, FiShield, FiTrash2 } from "react-icons/fi";
import type { UserTab } from "./user-tabs";

type UsersHeaderActionProps = {
  tab: UserTab;
  onCreateComplaint: () => void;
  onCreateStaff: () => void;
};

const BUTTON_CLASS =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 dark:focus-visible:ring-green-400 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]";

const LINK_CLASS =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-[#111111] transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:focus-visible:ring-zinc-400 motion-safe:active:scale-[0.99] dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-800";

const NOTE_CLASS =
  "flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400";

// Right side of the management card header: a create button for the
// complaints/staff tabs, a customer-mix report shortcut for the
// customers tab, a restore hint for the trash tab (mirroring the
// catalog trash), and a confirm reminder everywhere else.
export function UsersHeaderAction({
  tab,
  onCreateComplaint,
  onCreateStaff,
}: UsersHeaderActionProps) {
  if (tab === "complaints") {
    return (
      <button
        type="button"
        onClick={onCreateComplaint}
        className={BUTTON_CLASS}
      >
        <FiPlus aria-hidden="true" className="h-4 w-4" />
        Ghi nhận khiếu nại
      </button>
    );
  }
  if (tab === "staff") {
    return (
      <button type="button" onClick={onCreateStaff} className={BUTTON_CLASS}>
        <FiPlus aria-hidden="true" className="h-4 w-4" />
        Thêm nhân viên
      </button>
    );
  }
  if (tab === "customers") {
    return (
      <Link href="/admin/customer-mix/day" prefetch className={LINK_CLASS}>
        <FiPieChart aria-hidden="true" className="h-4 w-4" />
        Báo cáo nguồn khách
      </Link>
    );
  }
  if (tab === "trash") {
    return (
      <p className={NOTE_CLASS}>
        <FiTrash2 aria-hidden="true" className="h-4 w-4" />
        Khôi phục hoặc xóa vĩnh viễn
      </p>
    );
  }
  return (
    <p className={NOTE_CLASS}>
      <FiShield aria-hidden="true" className="h-4 w-4" />
      Mọi thao tác đều cần xác nhận
    </p>
  );
}
