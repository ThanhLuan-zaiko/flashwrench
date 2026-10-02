"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export type DropdownSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type DropdownSelectProps = {
  id: string;
  /** Id of the visible label element; names the button and the listbox. */
  labelId: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
};

const BUTTON_BASE =
  "flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-50";
const BUTTON_OK =
  "border-zinc-200 focus-visible:ring-zinc-500 dark:border-zinc-800";
const BUTTON_ERROR =
  "border-red-500 focus-visible:ring-red-500 dark:border-red-400";

// Button + popup listbox in the style of the account menu and the rescue
// issue picker: outside click and Escape close, selected option gets a
// check. Native <select> renders inconsistently across mobile browsers,
// so forms use this instead. Keyboard users tab between fields — options
// are plain buttons inside the panel.
export function DropdownSelect({
  id,
  labelId,
  value,
  onChange,
  options,
  placeholder = "Chọn…",
  disabled,
  error,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = options.find((option) => option.value === value) ?? null;

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
        aria-labelledby={labelId}
        aria-invalid={error || undefined}
        className={`${BUTTON_BASE} ${error ? BUTTON_ERROR : BUTTON_OK}`}
      >
        <span
          className={`min-w-0 truncate ${active ? "" : "text-zinc-400 dark:text-zinc-500"}`}
        >
          {active ? active.label : placeholder}
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${open ? "motion-safe:rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby={labelId}
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          {options.map((option) => {
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
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  {option.hint && (
                    <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {option.hint}
                    </span>
                  )}
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
