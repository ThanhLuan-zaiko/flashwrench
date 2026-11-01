"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { MaskLines } from "@/components/home/MaskLines";
import { useChapterMotion } from "@/hooks/useChapterMotion";

type PageIntroProps = {
  eyebrow: string;
  lines: string[];
  subtitle?: string;
  // An optional control shown beside the subtitle, for example the guide button.
  action?: ReactNode;
  // Text on the right of the hairline below the header, for example a count.
  meta?: string;
};

// Header chapter shared by the customer screens: eyebrow, masked headline,
// optional subtitle and action, then a hairline with the meta line on it. The
// same shape as the products and services intros.
export function PageIntro({
  eyebrow,
  lines,
  subtitle,
  action,
  meta,
}: PageIntroProps) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section ref={rootRef} className="flex w-full flex-col">
      <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
        {eyebrow}
      </p>
      <MaskLines
        as="h1"
        lines={lines}
        className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
      />
      {subtitle || action ? (
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          {subtitle ? (
            <p
              data-chapter-row
              className="max-w-xl text-sm leading-relaxed text-zinc-600 md:text-base dark:text-zinc-400"
            >
              {subtitle}
            </p>
          ) : (
            <span />
          )}
          {action ? <div className="w-fit">{action}</div> : null}
        </div>
      ) : null}
      <span
        data-rule
        aria-hidden="true"
        className="mt-6 block h-px origin-left bg-zinc-200 md:mt-8 dark:bg-zinc-800"
      />
      {meta ? (
        <div className="flex justify-end py-3">
          <p
            aria-live="polite"
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {meta}
          </p>
        </div>
      ) : null}
    </section>
  );
}
