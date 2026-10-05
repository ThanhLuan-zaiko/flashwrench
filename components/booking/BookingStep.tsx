import { type ReactNode, useId } from "react";

type BookingStepProps = {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
};

// Numbered step card for the booking flow: a plain bordered section with
// a step badge, heading and an optional guidance line. Screen readers get
// the step number as a hidden prefix so the visible title stays short.
export function BookingStep({
  step,
  title,
  description,
  children,
}: BookingStepProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900"
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2
            id={headingId}
            className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
          >
            <span className="sr-only">Bước {step}: </span>
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
