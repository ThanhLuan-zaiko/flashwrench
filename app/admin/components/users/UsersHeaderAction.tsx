"use client";

import { FiPlus, FiShield, FiTrash2 } from "react-icons/fi";
import type { UserTab } from "./user-tabs";

type UsersHeaderActionProps = {
  tab: UserTab;
  onCreateComplaint: () => void;
  onCreateStaff: () => void;
};

const BUTTON_CLASS =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200";

const NOTE_CLASS =
  "flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400";

// Right side of the management card header: a create button for the
// complaints/staff tabs, a restore hint for the trash tab (mirroring the
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
