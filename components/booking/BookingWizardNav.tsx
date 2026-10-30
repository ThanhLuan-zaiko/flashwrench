import { FiArrowRight } from "react-icons/fi";
import {
  BRAND_OUTLINE_BUTTON,
  BRAND_PRIMARY_BUTTON,
} from "@/components/ui/brand";

type BookingWizardProgressProps = {
  step: number;
  labels: readonly string[];
};

// Phone/tablet header of the stepped booking flow: one segment per step,
// filled navy up to the current one, plus "Bước N/M · label".
export function BookingWizardProgress({
  step,
  labels,
}: BookingWizardProgressProps) {
  return (
    <div className="flex flex-col gap-2.5 lg:hidden">
      <div aria-hidden="true" className="flex gap-1.5">
        {labels.map((label, index) => (
          <span
            key={label}
            className={`h-1 flex-1 rounded-full ${
              index <= step
                ? "bg-[#1E3A5F] dark:bg-zinc-100"
                : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>
      <p
        aria-live="polite"
        className="text-sm text-zinc-600 dark:text-zinc-400"
      >
        <span className="font-bold text-[#1E3A5F] dark:text-zinc-100">
          Bước {step + 1}/{labels.length}
        </span>{" "}
        · {labels[step]}
      </p>
    </div>
  );
}

type BookingWizardBarProps = {
  step: number;
  labels: readonly string[];
  onPrev: () => void;
  onNext: () => void;
};

// Pinned bottom bar on phones/tablets. "Tiếp tục" is the orange action
// on every step but the last, where the summary's confirm button takes
// over so the screen still has exactly one orange action.
export function BookingWizardBar({
  step,
  labels,
  onPrev,
  onNext,
}: BookingWizardBarProps) {
  const isLast = step === labels.length - 1;
  return (
    <div
      data-dock-bar="phone"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mx-auto flex max-w-3xl gap-2.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={step === 0}
          className={`${BRAND_OUTLINE_BUTTON} ${isLast ? "flex-1" : "shrink-0"}`}
        >
          Quay lại
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            className={`${BRAND_PRIMARY_BUTTON} min-w-0 flex-1`}
          >
            <span className="truncate">
              Tiếp tục: {labels[step + 1].toLocaleLowerCase("vi")}
            </span>
            <FiArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
