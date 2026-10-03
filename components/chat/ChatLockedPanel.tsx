"use client";

import Link from "next/link";
import { FiLock } from "react-icons/fi";

// Guest/locked body for the floating chat panel. Rendered instead of the
// thread list when the visitor cannot use chat: no inbox query runs here,
// the visitor just gets a clear path to sign in.
export function ChatLockedPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <FiLock
          className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
          aria-hidden
        />
      </span>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Đăng nhập để nhắn tin
      </p>
      <p className="max-w-65 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Bạn cần tài khoản khách hàng hoặc thợ để trò chuyện về đơn hàng.
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 active:scale-95 motion-safe:transition-transform dark:bg-zinc-100 dark:text-zinc-900"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Đăng ký
        </Link>
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Cuộc trò chuyện luôn gắn với một đơn hàng của bạn.
      </p>
    </div>
  );
}
