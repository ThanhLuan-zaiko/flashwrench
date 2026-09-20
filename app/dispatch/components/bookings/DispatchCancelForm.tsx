"use client";

import { FiLoader } from "react-icons/fi";

type DispatchCancelFormProps = {
  bookingId: string;
  note: string;
  running: boolean;
  onNote: (note: string) => void;
  onBack: () => void;
  onSubmit: (note: string) => void;
};

// Cancel sub-form: the API requires a human-readable reason, so the submit
// stays disabled until the dispatcher types one.
export function DispatchCancelForm({
  bookingId,
  note,
  running,
  onNote,
  onBack,
  onSubmit,
}: DispatchCancelFormProps) {
  const trimmed = note.trim();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!running && trimmed.length > 0) onSubmit(trimmed);
      }}
      className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <label
        htmlFor={`dispatch-cancel-${bookingId}`}
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
      >
        Lý do hủy đơn (bắt buộc)
      </label>
      <textarea
        id={`dispatch-cancel-${bookingId}`}
        value={note}
        onChange={(event) => onNote(event.target.value)}
        rows={2}
        maxLength={300}
        required
        placeholder="Ví dụ: khách đổi lịch, không liên lạc được…"
        className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={running}
          onClick={onBack}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Quay lại
        </button>
        <button
          type="submit"
          disabled={running || trimmed.length === 0}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {running && (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          Xác nhận hủy
        </button>
      </div>
    </form>
  );
}
