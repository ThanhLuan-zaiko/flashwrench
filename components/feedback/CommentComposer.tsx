"use client";

import { useState } from "react";
import { FiLoader, FiSend } from "react-icons/fi";

// Shared comment/reply form: textarea + submit. The caller owns the
// mutation and clears the box via key remount or the onDone callback.
export function CommentComposer({
  id,
  placeholder = "Viết bình luận…",
  submitLabel = "Gửi bình luận",
  pending,
  error,
  onSubmit,
  onCancel,
  autoFocus = false,
}: {
  id: string;
  placeholder?: string;
  submitLabel?: string;
  pending: boolean;
  error: string | null;
  onSubmit: (body: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = body.trim();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <label className="sr-only" htmlFor={id}>
        {placeholder}
      </label>
      <textarea
        id={id}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={1000}
        rows={2}
        // biome-ignore lint/a11y/noAutofocus: the reply box only mounts after the user picks "Trả lời", so focusing it keeps them in the flow they opened.
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="flex min-h-[44px] items-center justify-center gap-1.5 self-start rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          ) : (
            <FiSend aria-hidden="true" className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
