"use client";

import { useNextStep } from "nextstepjs";
import { FiHelpCircle } from "react-icons/fi";

type TourButtonProps = {
  tour: string;
  ariaLabel: string;
  label?: string;
  // "inverse" is for dark surfaces such as the navy home hero.
  variant?: "default" | "inverse";
};

const VARIANT_CLASSES = {
  default: "text-[#1E3A5F] focus-visible:ring-[#1E3A5F] dark:text-zinc-100",
  inverse: "text-white focus-visible:ring-white",
} as const;

// Opt-in trigger for a page guide tour, shown as a bold text link with a
// bare help icon. Tours never auto-play; the button starts the named tour on
// demand only.
export function TourButton({
  tour,
  ariaLabel,
  label = "Hướng dẫn",
  variant = "default",
}: TourButtonProps) {
  const { startNextStep } = useNextStep();

  return (
    <button
      type="button"
      onClick={() => startNextStep(tour)}
      aria-label={ariaLabel}
      title={label}
      className={`flex min-h-11 items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 motion-safe:active:scale-[0.99] ${VARIANT_CLASSES[variant]}`}
    >
      <FiHelpCircle aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}
