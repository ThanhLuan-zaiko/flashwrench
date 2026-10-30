import Image from "next/image";
import Link from "next/link";
import logoImage from "@/asset/flashwrench.png";
import { SITE_NAME, SITE_TAGLINE } from "./site-header.constants";

export function SiteLogo({ onNavy = false }: { onNavy?: boolean }) {
  return (
    <Link
      href="/"
      className={`group flex shrink-0 items-center gap-2.5 rounded-lg focus:outline-none ${onNavy ? "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F]" : "focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"}`}
      aria-label={`${SITE_NAME} - Trang chủ`}
    >
      <Image
        src={logoImage}
        alt=""
        priority
        className="hidden h-9 w-auto transition-transform sm:block duration-300 ease-out motion-safe:group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`text-base font-extrabold tracking-tight sm:text-lg sm:font-bold ${onNavy ? "text-white" : "text-zinc-900 dark:text-white"}`}
        >
          {SITE_NAME}
        </span>
        <span
          className={`hidden text-xs font-medium sm:block ${onNavy ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          {SITE_TAGLINE}
        </span>
      </span>
    </Link>
  );
}
