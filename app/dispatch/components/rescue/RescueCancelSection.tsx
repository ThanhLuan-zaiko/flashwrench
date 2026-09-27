"use client";

import { useState } from "react";
import { useDispatchRescueAction } from "@/hooks/rescue-inbox";

type RescueCancelSectionProps = {
  requestId: string;
  status: string;
  version: string | null;
  onDone: (title: string, close?: boolean) => void;
  onFail: () => void;
  onClose: () => void;
};

// Cancel with a mandatory note, plus force-expire for a stuck dispatched
// offer. Both are dispatcher-only overrides of the auto flow.
export function RescueCancelSection({
  requestId,
  status,
  version,
  onDone,
  onFail,
  onClose,
}: RescueCancelSectionProps) {
  const action = useDispatchRescueAction();
  const [note, setNote] = useState("");
  const busy = action.isPending;

  return (
    <div>
      <label
        htmlFor="rescue-cancel-note"
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
      >
        Lý do hủy (bắt buộc khi hủy ca)
      </label>
      <input
        id="rescue-cancel-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={busy}
        placeholder="Ví dụ: khách tự xử lý được"
        className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy || !note.trim()}
          onClick={() =>
            action.mutate(
              {
                requestId,
                body: {
                  action: "cancel",
                  note: note.trim(),
                  expectedUpdatedAt: version,
                },
              },
              {
                onSuccess: () => {
                  onDone("Đã hủy ca", true);
                  onClose();
                },
                onError: onFail,
              },
            )
          }
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
        >
          Hủy ca
        </button>
        {status === "dispatched" && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              action.mutate(
                {
                  requestId,
                  body: {
                    action: "expire-now",
                    expectedUpdatedAt: version,
                  },
                },
                {
                  onSuccess: () => onDone("Đã chuyển thợ kế tiếp"),
                  onError: onFail,
                },
              )
            }
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
          >
            Hết hạn ngay
          </button>
        )}
      </div>
    </div>
  );
}
