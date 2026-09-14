import Link from "next/link";
import { MobileMenuAuth } from "./MobileMenuAuth";
import type { NavItem } from "./site-header.types";

const ITEM_ENTER_DELAYS = [
  "motion-safe:delay-0",
  "motion-safe:delay-75",
  "motion-safe:delay-150",
  "motion-safe:delay-200",
];

type MobileMenuProps = {
  open: boolean;
  items: NavItem[];
  currentPath?: string;
  onNavigate?: () => void;
};

export function MobileMenu({
  open,
  items,
  currentPath = "/",
  onNavigate,
}: MobileMenuProps) {
  return (
    <div
      id="mobile-menu"
      className={`grid border-zinc-200 bg-white motion-safe:transition-[grid-template-rows,opacity,visibility] motion-safe:duration-300 motion-safe:ease-out md:hidden dark:border-zinc-800 dark:bg-zinc-950 ${
        open
          ? "visible grid-rows-[1fr] border-t opacity-100"
          : "invisible grid-rows-[0fr] opacity-0"
      }`}
    >
      <nav aria-label="Điều hướng di động" className="min-h-0 overflow-hidden">
        <div className="px-4 py-3 sm:px-6">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              const delay = ITEM_ENTER_DELAYS[index % ITEM_ENTER_DELAYS.length];
              return (
                <li
                  key={item.href}
                  className={`motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out ${delay} ${
                    open
                      ? "motion-safe:translate-x-0 motion-safe:opacity-100"
                      : "motion-safe:-translate-x-3 motion-safe:opacity-0"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-3 text-base font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-zinc-600 transition-colors duration-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                    }
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div
            className={`mt-3 border-t border-zinc-200 pt-3 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-safe:delay-300 dark:border-zinc-800 ${
              open
                ? "motion-safe:translate-y-0 motion-safe:opacity-100"
                : "motion-safe:translate-y-2 motion-safe:opacity-0"
            }`}
          >
            <MobileMenuAuth onNavigate={onNavigate} />
          </div>
        </div>
      </nav>
    </div>
  );
}
