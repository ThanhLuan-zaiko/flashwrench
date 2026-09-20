"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useDispatchAction } from "@/hooks/dispatch";
import type { BookingDetail } from "@/services/dispatch.api";
import { AuthApiError } from "@/services/dispatch.api";
import { AssignMechanicPicker } from "./AssignMechanicPicker";
import { DispatchCancelForm } from "./DispatchCancelForm";
import {
  assignActionLabel,
  DISPATCH_ACTION_LABELS,
  type DispatchBoardAction,
  dispatchActionsFor,
} from "./dispatch-actions";

type DispatchActionsProps = {
  booking: BookingDetail;
  onClose: () => void;
  onToast: (
    variant: "success" | "error",
    title: string,
    description?: string,
  ) => void;
};

type Mode = "idle" | "assign" | "cancel";

function actionError(error: unknown): string {
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return (
      errors.action ??
      errors.mechanicId ??
      errors.note ??
      errors.form ??
      error.message
    );
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

// Workflow controls for the open booking. Assign and cancel open inline
// sub-forms (mechanic picker / required reason); confirm runs immediately.
// expectedUpdatedAt rides along so a stale view can never overwrite a
// fresher change — the API answers 409 and we surface it.
export function DispatchActions({
  booking,
  onClose,
  onToast,
}: DispatchActionsProps) {
  const action = useDispatchAction();
  const [mode, setMode] = useState<Mode>("idle");
  const [note, setNote] = useState("");
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [mechanicName, setMechanicName] = useState<string | null>(null);
  const [running, setRunning] = useState<DispatchBoardAction | null>(null);

  const hasMechanic = booking.mechanicId !== null;
  const actions = dispatchActionsFor(booking.status, hasMechanic);
  if (actions.length === 0) return null;

  const run = (
    next: DispatchBoardAction,
    extra?: { mechanicId?: string; mechanicName?: string; note?: string },
  ) => {
    setRunning(next);
    action.mutate(
      {
        bookingId: booking.id,
        action: next,
        mechanicId: extra?.mechanicId,
        mechanicName: extra?.mechanicName,
        note: extra?.note,
        expectedUpdatedAt: booking.updatedAt,
      },
      {
        onSuccess: () => {
          setRunning(null);
          setMode("idle");
          setNote("");
          setMechanicId(null);
          setMechanicName(null);
          onToast(
            "success",
            DISPATCH_ACTION_LABELS[next],
            "Đã cập nhật đơn hàng.",
          );
          if (next === "cancel") onClose();
        },
        onError: (error) => {
          setRunning(null);
          onToast("error", "Không cập nhật được đơn", actionError(error));
        },
      },
    );
  };

  const labelFor = (next: DispatchBoardAction): string =>
    next === "assign"
      ? assignActionLabel(hasMechanic)
      : DISPATCH_ACTION_LABELS[next];

  const back = () => {
    setMode("idle");
    setNote("");
    setMechanicId(null);
    setMechanicName(null);
  };

  if (mode === "assign") {
    return (
      <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
        <AssignMechanicPicker
          lat={booking.addressLat}
          lng={booking.addressLng}
          value={mechanicId}
          excludeId={booking.mechanicId}
          disabled={running !== null}
          onChange={(id, name) => {
            setMechanicId(id);
            setMechanicName(name);
          }}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={running !== null}
            onClick={back}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Quay lại
          </button>
          <button
            type="button"
            disabled={running !== null || mechanicId === null}
            onClick={() =>
              mechanicId &&
              run("assign", { mechanicId, mechanicName: mechanicName ?? "" })
            }
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {running === "assign" && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            {running === "assign" ? "Đang phân công…" : "Xác nhận phân công"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "cancel") {
    return (
      <DispatchCancelForm
        bookingId={booking.id}
        note={note}
        running={running !== null}
        onNote={setNote}
        onBack={back}
        onSubmit={(value) => run("cancel", { note: value })}
      />
    );
  }

  const [primary, ...rest] = actions;
  return (
    <div className="flex flex-col gap-2">
      {primary && (
        <button
          type="button"
          disabled={running !== null}
          onClick={() =>
            primary === "confirm" ? run("confirm") : setMode(primary)
          }
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {running === primary && (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          {running === primary ? "Đang xử lý…" : labelFor(primary)}
        </button>
      )}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {rest.map((next) => (
            <button
              key={next}
              type="button"
              disabled={running !== null}
              onClick={() =>
                next === "confirm" ? run("confirm") : setMode(next)
              }
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {running === next && (
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 motion-safe:animate-spin"
                />
              )}
              {running === next ? "Đang xử lý…" : labelFor(next)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
