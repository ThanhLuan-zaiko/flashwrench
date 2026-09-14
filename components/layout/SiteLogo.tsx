import Link from "next/link";
import { FiTool } from "react-icons/fi";
import { SITE_NAME, SITE_TAGLINE } from "./site-header.constants";

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      aria-label={`${SITE_NAME} - Trang chủ`}
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
      >
        <FiTool
          aria-hidden="true"
          className="h-5 w-5 transition-transform duration-300 ease-out motion-safe:group-hover:rotate-12"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          {SITE_NAME}
        </span>
        <span className="hidden text-xs font-medium text-zinc-500 sm:block dark:text-zinc-400">
          {SITE_TAGLINE}
        </span>
      </span>
    </Link>
  );
}
