"use client";

import { useEffect, useRef } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiX,
} from "react-icons/fi";
import { RESCUE_ISSUE_OPTIONS } from "@/components/rescue/rescue-constants";
import {
  type RescueDetail,
  useOfferCountdown,
  useRescueAction,
  useRescueExpire,
} from "@/hooks/rescue-inbox";
import type { MechanicRescueAction } from "@/services/rescue-mechanic.api";
import { RescueCollectSection } from "./RescueCollectSection";

function issueLabel(issueType: string | null): string {
  return (
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === issueType)?.label ??
    "Cứu hộ khẩn cấp"
  );
}

// Per-status journey hints plus the one primary button that moves the
// rescue forward. The server enforces the allowed transitions; the card
// only reflects them.
const JOURNEY_STEPS: Partial<
  Record<string, { action: MechanicRescueAction; label: string; hint: string }>
> = {
  accepted: {
    action: "depart",
    label: "Bắt đầu di chuyển",
    hint: "Bạn đã nhận ca. Bấm khi xuất phát để khách thấy bạn đang tới.",
  },
  en_route: {
    action: "arrive",
    label: "Đã đến nơi",
    hint: "Bạn đang trên đường tới điểm cứu hộ. Bấm khi tới nơi.",
  },
  arrived: {
    action: "complete",
    label: "Hoàn tất cứu hộ",
    hint: "Đang xử lý tại chỗ. Bấm khi sự cố đã xong.",
  },
};

const STEP_ICONS = {
  depart: FiNavigation,
  arrive: FiMapPin,
  complete: FiCheckCircle,
} as const;

// One 30s rescue offer: live countdown, accept/decline actions, journey
// progress buttons after the mechanic commits, and a single auto-expire
// when the timer hits zero so the next mechanic gets the offer.
export function RescueInboxCard({ rescue }: { rescue: RescueDetail }) {
  const action = useRescueAction();
  const expire = useRescueExpire();
  const secondsLeft = useOfferCountdown(rescue.offerExpiresAt);
  const expiredFired = useRef(false);

  useEffect(() => {
    if (
      rescue.status === "dispatched" &&
      secondsLeft === 0 &&
      !expiredFired.current
    ) {
      expiredFired.current = true;
      expire.mutate(rescue.requestId);
    }
  }, [secondsLeft, rescue.status, rescue.requestId, expire]);

  const busy = action.isPending || expire.isPending;
  const offering = rescue.status === "dispatched";
  const step = JOURNEY_STEPS[rescue.status];

  return (
    <article
      aria-label="Yêu cầu cứu hộ được giao"
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {issueLabel(rescue.issueType)}
            {rescue.priority === "high" ? " · Ưu tiên" : ""}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {rescue.address ?? "Chưa rõ vị trí"} · {rescue.vehiclePlate ?? ""}
          </p>
        </div>
        {offering && secondsLeft !== null && (
          <p
            aria-live="polite"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700 tabular-nums dark:border-zinc-700 dark:text-zinc-200"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
            />
            {secondsLeft}s
          </p>
        )}
        {rescue.status === "en_route" && rescue.etaMin !== null && (
          <p className="shrink-0 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700 tabular-nums dark:border-zinc-700 dark:text-zinc-200">
            ~{rescue.etaMin} phút
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={`tel:${(rescue.customerPhone ?? "").replace(/\s/g, "")}`}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          <FiPhone aria-hidden="true" className="h-4 w-4" />
          {rescue.customerPhone ?? "Gọi khách"}
        </a>
        {offering && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                action.mutate({ requestId: rescue.requestId, action: "accept" })
              }
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
            >
              <FiCheck aria-hidden="true" className="h-4 w-4" />
              Nhận cứu hộ
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                action.mutate({
                  requestId: rescue.requestId,
                  action: "decline",
                })
              }
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              <FiX aria-hidden="true" className="h-4 w-4" />
              Từ chối
            </button>
          </>
        )}
        {step && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              action.mutate({
                requestId: rescue.requestId,
                action: step.action,
              })
            }
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            {(() => {
              const StepIcon =
                STEP_ICONS[step.action as keyof typeof STEP_ICONS];
              return StepIcon ? (
                <StepIcon aria-hidden="true" className="h-4 w-4" />
              ) : null;
            })()}
            {step.label}
          </button>
        )}
      </div>
      {step && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {step.hint}
        </p>
      )}
      <RescueCollectSection rescue={rescue} />
    </article>
  );
}
