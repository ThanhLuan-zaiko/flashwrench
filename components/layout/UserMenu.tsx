"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiLoader, FiLogIn, FiLogOut, FiUser } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useLogout, useMe } from "@/hooks/auth";
import { LOGIN_HREF, LOGIN_LABEL } from "./site-header.constants";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0]?.[0] ?? "U").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const toast = useToast();
  const me = useMe();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (me.isPending) {
    return (
      <output
        aria-label="Đang tải thông tin tài khoản"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500"
      >
        <FiLoader
          aria-hidden="true"
          className="h-5 w-5 motion-safe:animate-spin"
        />
      </output>
    );
  }

  if (!me.data) {
    return (
      <>
        <Link
          href={LOGIN_HREF}
          className="hidden items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.98] sm:flex dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          <FiLogIn aria-hidden="true" className="h-4 w-4 shrink-0" />
          {LOGIN_LABEL}
        </Link>
        <Link
          href={LOGIN_HREF}
          aria-label={LOGIN_LABEL}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 sm:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FiUser aria-hidden="true" className="h-5 w-5" />
        </Link>
      </>
    );
  }

  const user = me.data;
  const contact = user.phone || user.email;

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Đã đăng xuất", "Hẹn gặp lại bạn.");
        router.refresh();
      },
      onError: () => {
        toast.error("Đăng xuất thất bại", "Vui lòng thử lại sau.");
      },
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Đóng menu tài khoản" : "Mở menu tài khoản"}
        title={user.fullName}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-sm font-bold text-zinc-800 transition-all duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {getInitials(user.fullName)}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu tài khoản"
          className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {user.fullName}
            </p>
            {contact && (
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {contact}
              </p>
            )}
          </div>
          <div className="p-2">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiUser aria-hidden="true" className="h-4 w-4 shrink-0" />
              Thông tin tài khoản
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={logout.isPending}
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {logout.isPending ? (
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 motion-safe:animate-spin"
                />
              ) : (
                <FiLogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
