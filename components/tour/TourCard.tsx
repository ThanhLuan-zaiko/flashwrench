"use client";

import type { CardComponentProps } from "nextstepjs";
import { FiArrowLeft, FiArrowRight, FiX } from "react-icons/fi";

// Monochrome tour card shared by every page guide. Floating overlay so a
// subtle shadow is allowed; everything else is border and type hierarchy.
export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      className="w-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg sm:w-80 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {step.title}
        </h2>
        {skipTour && !isLast && (
          <button
            type="button"
            onClick={skipTour}
            aria-label="Bỏ qua hướng dẫn"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {step.content}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Bước {currentStep + 1} trên {totalSteps}
        </p>
        <div
          className="flex items-center gap-1"
          aria-hidden="true"
          role="presentation"
        >
          {Array.from({ length: totalSteps }, (_, index) => index).map(
            (position) => (
              <span
                key={position}
                className={
                  position === currentStep
                    ? "h-1.5 w-4 rounded-full bg-zinc-900 dark:bg-zinc-100"
                    : "h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"
                }
              />
            ),
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={prevStep}
          disabled={isFirst}
          aria-label="Quay lại bước trước"
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={nextStep}
          aria-label={isLast ? "Hoàn thành hướng dẫn" : "Tới bước tiếp theo"}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          {isLast ? "Hoàn thành" : "Tiếp theo"}
          {!isLast && <FiArrowRight aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>

      {skipTour && !isLast && (
        <button
          type="button"
          onClick={skipTour}
          className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Bỏ qua hướng dẫn
        </button>
      )}

      {arrow}
    </div>
  );
}
