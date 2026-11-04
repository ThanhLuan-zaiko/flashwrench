"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { parseTimeInput } from "@/components/ui/date-time-dropdown.utils";

type TimeTextInputProps = {
  /** Why this `HH:mm` cannot be used, or null when it can. */
  validate?: (time: string) => string | null;
  onCommit: (time: string) => void;
};

const INPUT =
  "min-h-9 w-full min-w-0 rounded-xl border border-zinc-500 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-500 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400";
const INPUT_ERROR =
  "min-h-9 w-full min-w-0 rounded-xl border border-red-500 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-400 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400";
const BUTTON =
  "min-h-9 shrink-0 rounded-xl bg-[#1D4ED8] px-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD] dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

// Free time entry inside a picker popup, for a time that is not in the list.
// Accepts "9", "9:30", "930" or "09.30"; Enter or the button applies it.
export function TimeTextInput({ validate, onCommit }: TimeTextInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commit() {
    const time = parseTimeInput(draft);
    if (!time) {
      setError("Nhập giờ từ 00:00 đến 23:59, ví dụ 09:20.");
      return;
    }
    const problem = validate?.(time) ?? null;
    setError(problem);
    if (!problem) onCommit(time);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    // The popup sits inside the page form; Enter must not submit that form.
    event.preventDefault();
    commit();
  }

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold text-zinc-800 dark:text-zinc-300"
      >
        Hoặc tự nhập giờ
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="VD: 09:20"
          value={draft}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={error ? INPUT_ERROR : INPUT}
        />
        <button type="button" onClick={commit} className={BUTTON}>
          Chọn
        </button>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
