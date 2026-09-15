"use client";

import { useState } from "react";
import { FiCheck, FiCopy, FiKey } from "react-icons/fi";

type StaffPendingPasswordProps = {
  tempPassword: string;
};

// Persistent temp password box inside one staff row. Visible until the
// staff member changes their password, then removed in realtime.
export function StaffPendingPassword({
  tempPassword,
}: StaffPendingPasswordProps) {
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className="mt-2 block rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
        <FiKey aria-hidden="true" className="h-3.5 w-3.5" />
        Mật khẩu tạm — chưa đổi
      </span>
      <span className="mt-1.5 flex items-center gap-2">
        <span className="flex-1 truncate font-mono text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-50">
          {tempPassword}
        </span>
        <button
          type="button"
          onClick={() => void copyPassword()}
          aria-label={copied ? "Đã sao chép mật khẩu" : "Sao chép mật khẩu"}
          className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
        >
          {copied ? (
            <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <FiCopy aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {copied ? "Đã sao chép" : "Sao chép"}
        </button>
      </span>
    </span>
  );
}
