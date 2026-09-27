import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { RESCUE_ISSUE_OPTIONS } from "./rescue-constants";

type RescueIssueSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

const BUTTON_BASE =
  "flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-50";
const BUTTON_OK =
  "border-zinc-300 focus-visible:ring-zinc-500 dark:border-zinc-700";
const BUTTON_ERROR =
  "border-red-500 focus-visible:ring-red-500 dark:border-red-400";

// Custom dropdown for the breakdown picker: same look as the account
// menu, with outside-click and Escape to close. Native select renders
// inconsistently across mobile browsers, so the form uses this instead.
export function RescueIssueSelect({
  id,
  value,
  onChange,
  error,
  disabled,
}: RescueIssueSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = RESCUE_ISSUE_OPTIONS.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
        className={`${BUTTON_BASE} ${error ? BUTTON_ERROR : BUTTON_OK}`}
      >
        <span
          className={active ? undefined : "text-zinc-400 dark:text-zinc-500"}
        >
          {active ? active.label : "Chọn sự cố…"}
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 motion-safe:transform dark:text-zinc-400 ${open ? "motion-safe:rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          {RESCUE_ISSUE_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  selected ? "bg-zinc-100 dark:bg-zinc-800" : "bg-transparent"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {option.hint}
                  </span>
                </span>
                {selected && (
                  <FiCheck
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-200"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
