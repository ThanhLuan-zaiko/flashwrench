"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useMe } from "@/hooks/auth";
import { useCancelRescue } from "@/hooks/rescue";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { canCustomerCancelRescue } from "@/lib/rescue/rescue-status";
import { RescueApiError } from "@/services/rescue.api";

const MAX_CANCEL_NOTE = 300;

type RescueCancelSectionProps = {
  requestId: string;
  status: string | null;
};

// Customer self-cancel while no mechanic has departed (open → accepted).
// Guests never see this: the section gates on the signed-in role and the
// server re-checks ownership before writing, so a shared tracking link
// can never become a cancel button for whoever holds it.
export function RescueCancelSection({
  requestId,
  status,
}: RescueCancelSectionProps) {
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const cancelRescue = useCancelRescue();
  const toast = useToast();
  const sessionExpired = useSessionExpired();
  const me = useMe();
  const fieldId = `rescue-cancel-note-${requestId}`;

  if (me.data?.role !== "customer" || !canCustomerCancelRescue(status)) {
    return null;
  }

  const cancel = () => {
    const trimmed = note.trim().replace(/\s+/g, " ");
    if (trimmed.length === 0) {
      setError("Vui lòng nhập lý do hủy.");
      return;
    }
    setError("");
    cancelRescue.mutate(
      { requestId, note: trimmed },
      {
        onSuccess: () => {
          setConfirming(false);
          toast.success(
            "Đã hủy yêu cầu cứu hộ",
            "Thợ và điều phối viên đã được báo.",
          );
        },
        onError: (err) => {
          if (sessionExpired(err, "/history/rescue")) return;
          setError(
            err instanceof RescueApiError
              ? (err.errors.form ??
                  err.errors.note ??
                  "Không hủy được yêu cầu. Vui lòng thử lại.")
              : "Không hủy được yêu cầu. Vui lòng thử lại.",
          );
        },
      },
    );
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Hủy yêu cầu cứu hộ
      </button>
    );
  }

  return (
    <section
      aria-label="Hủy yêu cầu cứu hộ"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Hủy yêu cầu cứu hộ này?
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Hệ thống sẽ dừng tìm thợ và báo cho thợ đã nhận ca (nếu có) ngay lập
        tức.
      </p>
      <label
        htmlFor={fieldId}
        className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        Lý do hủy (bắt buộc)
      </label>
      <textarea
        id={fieldId}
        value={note}
        maxLength={MAX_CANCEL_NOTE}
        rows={2}
        disabled={cancelRescue.isPending}
        onChange={(event) => {
          setNote(event.target.value);
          if (error) setError("");
        }}
        placeholder="Ví dụ: xe đã nổ được, tìm được chỗ sửa gần"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200 hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:ring-offset-zinc-950"
      />
      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={cancelRescue.isPending}
          onClick={cancel}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {cancelRescue.isPending && (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          Xác nhận hủy
        </button>
        <button
          type="button"
          disabled={cancelRescue.isPending}
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Giữ yêu cầu
        </button>
      </div>
    </section>
  );
}
