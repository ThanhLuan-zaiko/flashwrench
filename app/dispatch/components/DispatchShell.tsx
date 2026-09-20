"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useLogout, useMe } from "@/hooks/auth";
import { useDispatchOperations } from "@/hooks/dispatch";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { DispatchSidebar } from "./DispatchSidebar";
import {
  type DispatchSectionId,
  getDispatchSection,
} from "./dispatch-sections";

function sectionIdForPath(_pathname: string): DispatchSectionId {
  return "board";
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

// Shell owns layout only: sidebar plus sticky section header plus centered
// bento content column. The operations topic subscription lives here so the
// whole workspace refreshes and toasts on new bookings, not just one list.
export function DispatchShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const section = getDispatchSection(sectionIdForPath(pathname));
  const SectionIcon = section.icon;
  const me = useMe();
  const logout = useLogout();
  const toast = useToast();
  const realtime = useRealtimeStatus();

  // Every booking mutation (create, assign, status flips, payments) lands
  // on the operations topic; the hook invalidates all dispatch queries.
  useDispatchOperations((event) => {
    if (event.kind === "booking-created") {
      toast.success(
        "Có đơn mới",
        "Một khách hàng vừa đặt lịch. Mở tab Chờ xử lý để điều phối.",
      );
    }
  });

  return (
    <div className="flex w-full flex-1 items-stretch bg-zinc-50 dark:bg-zinc-950">
      <DispatchSidebar
        active={section.id}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        displayName={me.data?.fullName ?? null}
        onLogout={() => logout.mutate()}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-16 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu điều phối"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FiMenu aria-hidden="true" className="h-5 w-5" />
            </button>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <SectionIcon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
                {section.label}
              </h1>
              <p className="hidden truncate text-xs text-zinc-500 sm:block dark:text-zinc-400">
                {section.description}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 sm:flex dark:border-zinc-800 dark:text-zinc-300">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  realtime === "live"
                    ? "bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
                    : "border border-zinc-400 dark:border-zinc-500"
                }`}
              />
              {realtime === "live" ? "Trực tiếp" : "Mất kết nối realtime"}
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {getInitials(me.data?.fullName ?? "")}
            </span>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
