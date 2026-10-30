"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { BRAND_OUTLINE_BUTTON } from "@/components/ui/brand";
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
  eyebrow?: string;
  // Short trust lines under the form, e.g. what an account unlocks.
  perks?: string[];
};

// Auth shell. Phones: a navy band with the heading that continues the
// header, then a white rounded sheet holding the form. From sm up: the
// bento grid with brand panel, form card and trust minis.
export function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  eyebrow,
  perks,
}: AuthCardProps) {
  const rootRef = useBentoReveal<HTMLDivElement>();

  return (
    <main className="flex flex-1 bg-[#1E3A5F] sm:bg-white dark:sm:bg-zinc-950">
      <div
        ref={rootRef}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col sm:gap-3 sm:px-6 sm:py-6 md:gap-4 md:py-10"
      >
        <Link
          href="/"
          className="hidden min-h-[44px] items-center gap-1.5 self-start text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] sm:inline-flex dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="grid flex-1 grid-cols-1 sm:flex-none sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-4">
          <AuthBrandPanel className="hidden sm:flex" />

          <section
            aria-label={title}
            data-reveal
            className="flex flex-col sm:col-span-2 sm:rounded-2xl sm:border sm:border-zinc-200 sm:bg-white lg:col-span-2 lg:row-span-2 dark:sm:border-zinc-800 dark:sm:bg-zinc-950"
          >
            <div className="px-5 pt-5 pb-11 text-white sm:px-8 sm:pt-8 sm:pb-0 sm:text-zinc-900 dark:sm:text-zinc-50">
              {eyebrow && (
                <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase sm:text-[#1E3A5F] dark:sm:text-zinc-400">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-[30px] leading-[1.1] font-extrabold tracking-tight sm:text-2xl sm:font-bold">
                {title}
              </h1>
              <p className="mt-2 text-sm text-zinc-200 sm:text-zinc-600 dark:sm:text-zinc-400">
                {subtitle}
              </p>
            </div>
            <div className="-mt-6 flex flex-1 flex-col rounded-t-3xl bg-white px-5 pt-6 pb-8 sm:mt-0 sm:rounded-none sm:bg-transparent sm:px-8 sm:pb-8 dark:bg-zinc-950 dark:sm:bg-transparent">
              {children}
              <div className="mt-5 flex flex-col gap-2.5 text-center sm:mt-6 sm:border-t sm:border-zinc-200 sm:pt-5 dark:sm:border-zinc-800">
                <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
                  {footerText}
                </p>
                <Link href={footerLinkHref} className={BRAND_OUTLINE_BUTTON}>
                  {footerLinkLabel}
                </Link>
              </div>
              {perks && perks.length > 0 && (
                <ul className="mt-auto flex flex-col items-center gap-1 pt-10 text-[11px] text-zinc-500 sm:pt-6 dark:text-zinc-400">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-1.5">
                      <FiCheck aria-hidden="true" className="h-3 w-3" />
                      {perk}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <div className="hidden sm:contents">
            <AuthHighlights />
          </div>
        </div>
      </div>
    </main>
  );
}
