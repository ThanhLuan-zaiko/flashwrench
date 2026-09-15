"use client";

import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

type StaffCreatedPanelProps = {
  fullName: string;
  tempPassword: string;
  onDone: () => void;
};

// One-time temp password view after creating staff. Shown exactly once:
// the plain password is never stored and never returned again.
export function StaffCreatedPanel({
  fullName,
  tempPassword,
  onDone,
}: StaffCreatedPanelProps) {
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
    <div>
      <p className="mt-3 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
        Đã tạo tài khoản cho {fullName}. Mật khẩu tạm chỉ hiện một lần duy nhất
        — hãy gửi cho nhân viên ngay.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <span className="flex-1 font-mono text-lg font-bold tracking-wider text-zinc-900 dark:text-zinc-50">
          {tempPassword}
        </span>
        <button
          type="button"
          onClick={() => void copyPassword()}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {copied ? (
            <FiCheck aria-hidden="true" className="h-4 w-4" />
          ) : (
            <FiCopy aria-hidden="true" className="h-4 w-4" />
          )}
          {copied ? "Đã sao chép" : "Sao chép"}
        </button>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Hoàn tất
      </button>
    </div>
  );
}
