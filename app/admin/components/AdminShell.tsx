"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { FiMenu } from "react-icons/fi";
import { AdminSidebar } from "./AdminSidebar";
import { type AdminSectionId, getAdminSection } from "./admin-sections";

function sectionIdForPath(pathname: string): AdminSectionId {
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/services")) return "services";
  return "dashboard";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const section = getAdminSection(sectionIdForPath(pathname));

  return (
    <div className="flex w-full flex-1 items-stretch">
      <AdminSidebar
        active={section.id}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-4 sm:px-6 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu quản trị"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiMenu aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {section.label}
            </h1>
            <p className="hidden truncate text-xs text-zinc-500 sm:block dark:text-zinc-400">
              {section.description}
            </p>
          </div>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
