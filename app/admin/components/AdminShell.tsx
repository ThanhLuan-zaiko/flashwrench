"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { FiMenu } from "react-icons/fi";
import { AdminSidebar } from "./AdminSidebar";
import { getAdminSection, sectionIdForPath } from "./admin-sections";

// Shell owns layout only: sidebar plus sticky section header plus
// centered bento content column. No business logic here.
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const section = getAdminSection(sectionIdForPath(pathname));
  const SectionIcon = section.icon;

  return (
    <div className="flex w-full flex-1 items-stretch bg-zinc-50 dark:bg-zinc-950">
      <AdminSidebar
        active={section.id}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-16 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu quản trị"
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
                className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
              />
              Trực tuyến
            </span>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
