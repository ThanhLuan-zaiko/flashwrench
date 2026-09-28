"use client";

import { FiKey, FiLoader, FiSend } from "react-icons/fi";

type ConfirmCodeFieldProps = {
  id: string;
  value: string;
  disabled: boolean;
  issuePending: boolean;
  issued: boolean;
  onChange: (value: string) => void;
  onIssue: () => void;
};

// Six-digit confirmation code input for cash collections. "Gửi mã" rotates
// the code onto the customer's screen — the mechanic hears it spoken and
// types it back as the handover proof.
export function ConfirmCodeField({
  id,
  value,
  disabled,
  issuePending,
  issued,
  onChange,
  onIssue,
}: ConfirmCodeFieldProps) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          Mã xác nhận của khách — 6 chữ số
        </label>
        <button
          type="button"
          onClick={onIssue}
          disabled={disabled || issuePending}
          className="flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-300 px-2.5 text-[11px] font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {issuePending ? (
            <FiLoader
              aria-hidden="true"
              className="h-3 w-3 motion-safe:animate-spin"
            />
          ) : (
            <FiSend aria-hidden="true" className="h-3 w-3" />
          )}
          {issued ? "Đã gửi — gửi lại" : "Gửi mã cho khách"}
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <FiKey
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
        />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-lg font-semibold tracking-[0.3em] text-zinc-900 outline-none transition-colors focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Khách đọc mã trên màn hình của họ — nhập lại để xác nhận đã nhận tiền
        mặt.
      </p>
    </div>
  );
}
