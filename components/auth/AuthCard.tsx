"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { AuthHighlights } from "./AuthHighlights";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
};

// Auth shell as one bento grid: inverted brand panel plus form card
// plus trust minis. Same props as before so pages stay untouched.
export function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: AuthCardProps) {
  const rootRef = useBentoReveal<HTMLDivElement>();

  return (
    <main className="flex flex-1 bg-zinc-50 dark:bg-black">
      <div
        ref={rootRef}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-6 sm:px-6 md:gap-4 md:py-10"
      >
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 self-start text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          <AuthBrandPanel />

          <section
            aria-label={title}
            data-reveal
            className="rounded-2xl border border-zinc-200 bg-white p-6 sm:col-span-2 sm:p-8 lg:col-span-2 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
            <div className="mt-6">{children}</div>
            <p className="mt-6 border-t border-zinc-200 pt-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              {footerText}{" "}
              <Link
                href={footerLinkHref}
                className="font-semibold text-zinc-900 underline-offset-4 transition-colors duration-200 hover:underline dark:text-zinc-50"
              >
                {footerLinkLabel}
              </Link>
            </p>
          </section>

          <AuthHighlights />
        </div>
      </div>
    </main>
  );
}
