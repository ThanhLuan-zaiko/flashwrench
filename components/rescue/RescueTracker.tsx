"use client";

import { FiCheck, FiLoader, FiXCircle } from "react-icons/fi";
import { useRescueTracking } from "@/hooks/rescue";
import { formatDateTime } from "@/lib/datetime/format";
import {
  RESCUE_PROGRESS_STEPS,
  type RescueProgressStep,
  rescueProgressStep,
} from "@/lib/rescue/rescue-status";
import { RescueCancelSection } from "./RescueCancelSection";

const STEP_LABELS: Record<RescueProgressStep, string> = {
  received: "Đã gửi yêu cầu",
  finding: "Đang tìm thợ",
  en_route: "Thợ đang di chuyển",
  arrived: "Thợ đã đến nơi",
  completed: "Hoàn tất",
};

type RescueTrackerProps = {
  requestId: string;
};

// Live journey stepper for the requester. Polls the public tracking
// endpoint — no login needed — until the rescue reaches a terminal state.
export function RescueTracker({ requestId }: RescueTrackerProps) {
  const query = useRescueTracking(requestId);
  const tracking = query.data?.tracking ?? null;
  const step = rescueProgressStep(tracking?.status ?? null);
  const activeIndex =
    step === "cancelled" ? -1 : RESCUE_PROGRESS_STEPS.indexOf(step);

  if (query.isPending) {
    return (
      <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang tải tiến trình…
      </p>
    );
  }

  if (query.isError || !tracking) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Không tải được tiến trình. Trang sẽ tự thử lại — hoặc gọi hotline để
        được hỗ trợ.
      </p>
    );
  }

  if (step === "cancelled") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-zinc-300 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <FiXCircle
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
        />
        <p className="text-zinc-700 dark:text-zinc-300">
          Yêu cầu cứu hộ đã được hủy. Nếu bạn vẫn cần hỗ trợ, hãy gọi hotline
          hoặc gửi yêu cầu mới.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ol aria-label="Tiến trình cứu hộ" className="flex flex-col gap-2">
        {RESCUE_PROGRESS_STEPS.map((id, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={id} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : active
                      ? "border-zinc-900 dark:border-white"
                      : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {done ? (
                  <FiCheck className="h-3 w-3" />
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-white" />
                ) : null}
              </span>
              <span
                className={`text-sm ${
                  active
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : done
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {STEP_LABELS[id]}
                {id === "finding" && tracking.mechanicName
                  ? ` · ${tracking.mechanicName}`
                  : ""}
                {id === "en_route" && tracking.etaMin !== null
                  ? ` · ~${tracking.etaMin} phút`
                  : ""}
              </span>
            </li>
          );
        })}
      </ol>
      {tracking.updatedAt && (
        <p
          aria-live="polite"
          className="text-[11px] text-zinc-400 dark:text-zinc-500"
        >
          Cập nhật {formatDateTime(tracking.updatedAt)} · tự làm mới mỗi 15 giây
        </p>
      )}
      <RescueCancelSection
        requestId={tracking.requestId}
        status={tracking.status}
      />
    </div>
  );
}
