import Link from "next/link";
import { isNavActive } from "./nav-active";
import type { NavItem } from "./site-header.types";

type HeaderNavProps = {
  items: NavItem[];
  currentPath?: string;
};

export function HeaderNav({ items, currentPath = "/" }: HeaderNavProps) {
  return (
    <nav aria-label="Điều hướng chính" className="hidden min-w-0 xl:block">
      <ul className="flex items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(currentPath, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                }
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
