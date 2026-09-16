"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useBookingAction } from "@/hooks/mechanic";
import {
  ACTION_LABELS,
  availableActions,
  type MechanicBookingAction,
} from "@/lib/mechanic/mechanic-status";
import type { MechanicBookingDetail } from "@/services/mechanic.api";
import { AuthApiError } from "@/services/mechanic.api";

type BookingActionsProps = {
  booking: MechanicBookingDetail;
  onClose: () => void;
  onToast: (
    variant: "success" | "error",
    title: string,
    description?: string,
  ) => void;
};

const NOTE_ACTIONS: MechanicBookingAction[] = [
  "decline",
  "cancel",
  "complete",
  "mark-no-show",
];

function actionError(error: unknown): string {
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return errors.action ?? errors.form ?? error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

// Workflow buttons for the open booking. Quick steps run immediately with
// an optimistic flip; decline/complete/cancel ask for a short note first.
// The dialog closes only on terminal steps so the mechanic sees the new
// state of intermediate ones.
export function BookingActions({
  booking,
  onClose,
  onToast,
}: BookingActionsProps) {
  const action = useBookingAction();
  const [confirming, setConfirming] = useState<MechanicBookingAction | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [running, setRunning] = useState<MechanicBookingAction | null>(null);

  const actions = availableActions(booking.status);
  if (actions.length === 0) return null;

  const run = (next: MechanicBookingAction, withNote?: string) => {
    setRunning(next);
    action.mutate(
      { bookingId: booking.id, action: next, note: withNote },
      {
        onSuccess: () => {
          setRunning(null);
          setConfirming(null);
          setNote("");
          onToast("success", ACTION_LABELS[next], "Đã cập nhật đơn hàng.");
          if (next === "complete" || next === "cancel") onClose();
        },
        onError: (error) => {
          setRunning(null);
          onToast("error", "Không cập nhật được đơn", actionError(error));
        },
      },
    );
  };

  const primary = actions[0];
  const rest = actions.slice(1);

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <NoteForm
          bookingId={booking.id}
          action={confirming}
          note={note}
          running={running !== null}
          onNote={setNote}
          onBack={() => {
            setConfirming(null);
            setNote("");
          }}
          onSubmit={() =>
            run(confirming, note.trim() ? note.trim() : undefined)
          }
        />
      ) : (
        <>
          {primary && (
            <ActionButton
              action={primary}
              primary
              busy={running !== null}
              running={running === primary}
              onRun={() =>
                NOTE_ACTIONS.includes(primary)
                  ? setConfirming(primary)
                  : run(primary)
              }
            />
          )}
          {rest.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {rest.map((next) => (
                <ActionButton
                  key={next}
                  action={next}
                  primary={false}
                  busy={running !== null}
                  running={running === next}
                  onRun={() =>
                    NOTE_ACTIONS.includes(next)
                      ? setConfirming(next)
                      : run(next)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
  function ActionButton({
    action,
    primary,
    busy,
    running,
    onRun,
  }: {
    action: MechanicBookingAction;
    primary: boolean;
    busy: boolean;
    running: boolean;
    onRun: () => void;
  }) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onRun}
        className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] ${
          primary
            ? "w-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            : "flex-1 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        {running && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        {running ? "Đang xử lý…" : ACTION_LABELS[action]}
      </button>
    );
  }

  function NoteForm({
    bookingId,
    action,
    note,
    running,
    onNote,
    onBack,
    onSubmit,
  }: {
    bookingId: string;
    action: MechanicBookingAction;
    note: string;
    running: boolean;
    onNote: (note: string) => void;
    onBack: () => void;
    onSubmit: () => void;
  }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!running) onSubmit();
        }}
        className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <label
          htmlFor={`booking-note-${bookingId}`}
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          {ACTION_LABELS[action]} — ghi chú cho khách (không bắt buộc)
        </label>
        <textarea
          id={`booking-note-${bookingId}`}
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Ví dụ: khách hẹn lại vào ngày mai…"
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
            disabled={running}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {running && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            Xác nhận
          </button>
        </div>
      </form>
    );
  }
}
