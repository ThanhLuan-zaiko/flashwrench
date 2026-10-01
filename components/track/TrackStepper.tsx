"use client";

import { FiCheck } from "react-icons/fi";
import { formatDateTime } from "@/lib/datetime/format";

export type TrackStep = { id: string; label: string };

type TrackStepperProps = {
  ariaLabel: string;
  steps: TrackStep[];
  activeIndex: number;
  /** Per-step suffix rendered after the label, e.g. a courier name. */
  stepHints?: Record<string, string>;
  updatedAt?: string | null;
};

// Shared vertical journey stepper for the public tracking screens —
// the same visual contract as the rescue tracker.
export function TrackStepper({
  ariaLabel,
  steps,
  activeIndex,
  stepHints,
  updatedAt,
}: TrackStepperProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <ol aria-label={ariaLabel} className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={step.id} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : active
                      ? "border-zinc-900 dark:border-white"
                      : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {done ? (
                  <FiCheck className="h-3 w-3" />
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-white" />
                ) : null}
              </span>
              <span
                className={`text-sm ${
                  active
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : done
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {step.label}
                {active && stepHints?.[step.id]
                  ? ` · ${stepHints[step.id]}`
                  : ""}
              </span>
            </li>
          );
        })}
      </ol>
      {updatedAt && (
        <p
          aria-live="polite"
          className="text-[11px] text-zinc-400 dark:text-zinc-500"
        >
          Cập nhật {formatDateTime(updatedAt)} · tự làm mới mỗi 15 giây
        </p>
      )}
    </div>
  );
}
