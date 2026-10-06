"use client";

import { useNextStep } from "nextstepjs";
import { FiHelpCircle } from "react-icons/fi";

type TourButtonProps = {
  tour: string;
  ariaLabel: string;
  label?: string;
};

// Opt-in trigger for a page guide tour. Tours never auto-play; the button
// starts the named tour on demand only.
export function TourButton({
  tour,
  ariaLabel,
  label = "Hướng dẫn",
}: TourButtonProps) {
  const { startNextStep } = useNextStep();

  return (
    <button
      type="button"
      onClick={() => startNextStep(tour)}
      aria-label={ariaLabel}
      title={label}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] sm:px-4 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      <FiHelpCircle aria-hidden="true" className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
