"use client";

import Link from "next/link";
import { useState } from "react";
import { FiLogIn, FiMenu, FiUser, FiX } from "react-icons/fi";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { HeaderNav } from "./HeaderNav";
import { MobileMenu } from "./MobileMenu";
import { SiteLogo } from "./SiteLogo";
import { LOGIN_HREF, LOGIN_LABEL, NAV_ITEMS } from "./site-header.constants";

type SiteHeaderProps = {
  currentPath?: string;
};

export function SiteHeader({ currentPath = "/" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <SiteLogo />

        <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <HeaderNav items={NAV_ITEMS} currentPath={currentPath} />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />

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

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {menuOpen ? (
              <FiX aria-hidden="true" className="h-6 w-6" />
            ) : (
              <FiMenu aria-hidden="true" className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        items={NAV_ITEMS}
        currentPath={currentPath}
        onNavigate={() => setMenuOpen(false)}
      />
    </header>
  );
}
