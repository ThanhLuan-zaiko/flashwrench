"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLoader, FiLogIn, FiLogOut, FiUser } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useLogout, useMe } from "@/hooks/auth";
import { LOGIN_HREF, LOGIN_LABEL } from "./site-header.constants";

type MobileMenuAuthProps = {
  onNavigate?: () => void;
};

export function MobileMenuAuth({ onNavigate }: MobileMenuAuthProps) {
  const router = useRouter();
  const toast = useToast();
  const me = useMe();
  const logout = useLogout();

  if (me.isPending) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang tải thông tin tài khoản…
      </p>
    );
  }

  if (!me.data) {
    return (
      <Link
        href={LOGIN_HREF}
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-center text-base font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        <FiLogIn aria-hidden="true" className="h-5 w-5 shrink-0" />
        {LOGIN_LABEL}
      </Link>
    );
  }

  const user = me.data;
  const contact = user.phone || user.email;

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        onNavigate?.();
        toast.success("Đã đăng xuất", "Hẹn gặp lại bạn.");
        router.refresh();
      },
      onError: () => {
        toast.error("Đăng xuất thất bại", "Vui lòng thử lại sau.");
      },
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-3 px-1">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-sm font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <FiUser aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {user.fullName}
          </span>
          {contact && (
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {contact}
            </span>
          )}
        </span>
      </div>
      <Link
        href="/account"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <FiUser aria-hidden="true" className="h-4 w-4 shrink-0" />
        Thông tin tài khoản
      </Link>
      <button
        type="button"
        disabled={logout.isPending}
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {logout.isPending ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiLogOut aria-hidden="true" className="h-4 w-4" />
        )}
        {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
    </div>
  );
}
