"use client";

import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

type StaffCreatedPanelProps = {
  fullName: string;
  tempPassword: string;
  onDone: () => void;
};

// Temp password view after creating staff. The password stays visible in
// the staff list until the staff member changes it, with realtime removal.
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
      <p className="mt-3 text-xs text-zinc-800 dark:text-zinc-300">
        Đã tạo tài khoản cho {fullName}. Mật khẩu tạm vẫn hiển thị trong danh
        sách cho đến khi nhân viên đổi mật khẩu — hãy gửi cho nhân viên ngay.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <span className="flex-1 font-mono text-lg font-bold tracking-wider text-[#111111] dark:text-zinc-50">
          {tempPassword}
        </span>
        <button
          type="button"
          onClick={() => void copyPassword()}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-600 px-3 py-2 text-xs font-semibold text-[#111111] transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:focus-visible:ring-zinc-400 dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-800"
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
        className="mt-4 inline-flex min-h-[44px] items-center justify-center self-start rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 dark:focus-visible:ring-zinc-400 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
      >
        Hoàn tất
      </button>
    </div>
  );
}
