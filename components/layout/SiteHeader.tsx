"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CartLink } from "./CartLink";
import { GuestRecordsMenu } from "./GuestRecordsMenu";
import { HeaderNav } from "./HeaderNav";
import { usesTaskBar } from "./header-tone";
import { MobileMenu } from "./MobileMenu";
import { SiteLogo } from "./SiteLogo";
import { NAV_ITEMS } from "./site-header.constants";
import { UserMenu } from "./UserMenu";

type SiteHeaderProps = {
  currentPath?: string;
};

// The header reads the live pathname so /rescue highlights Rescue
// instead of Home. The optional prop stays as a test override.
export function SiteHeader({ currentPath }: SiteHeaderProps) {
  const pathname = usePathname();
  const activePath = currentPath ?? pathname ?? "/";
  const taskRoute = usesTaskBar(activePath);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 bg-[#1E3A5F] ${taskRoute ? "max-sm:hidden" : ""}`}
    >
      <div className="mx-auto flex h-12 max-w-7xl sm:h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:gap-4 lg:px-8">
        <SiteLogo onNavy />

        {/* Seven labeled links plus the logo and a guest's
        cart/theme/login controls need about 1,170px, so below xl the
        inline nav collided with the controls. It therefore starts at
        xl; narrower screens use the menu button instead. */}
        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <HeaderNav items={NAV_ITEMS} currentPath={activePath} onNavy />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <GuestRecordsMenu onNavy />

          <CartLink onNavy />

          {/* Phones keep only cart + menu; theme and account live in the
          mobile menu there. */}
          <div className="hidden sm:contents">
            <ThemeToggle onNavy />
            <UserMenu onNavy />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-100 transition-all duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-95 xl:hidden"
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
        currentPath={activePath}
        onNavigate={() => setMenuOpen(false)}
      />
    </header>
  );
}
