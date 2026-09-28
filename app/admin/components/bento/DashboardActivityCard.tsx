import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiKey,
  FiLoader,
  FiRotateCcw,
} from "react-icons/fi";
import { formatDateTime } from "@/lib/datetime/format";
import type { PaymentAuditEvent } from "@/lib/revenue/revenue.types";
import { BentoCard } from "./BentoCard";

const ACTION_LABELS: Record<string, string> = {
  recorded: "Ghi nhận thu tiền",
  confirm_code_issued: "Cấp mã xác nhận",
  confirm_failed: "Sai mã xác nhận",
  refund_marked: "Đánh dấu hoàn tiền",
};

const ACTION_ICONS: Record<string, typeof FiCheckCircle> = {
  recorded: FiCheckCircle,
  confirm_code_issued: FiKey,
  confirm_failed: FiAlertCircle,
  refund_marked: FiRotateCcw,
};

type DashboardActivityCardProps = {
  events: PaymentAuditEvent[] | undefined;
  isPending: boolean;
  isError: boolean;
};

// Latest payment-side events of the day: receipts, issued codes and
// failed confirmations — the ops trail the alert card counts on.
export function DashboardActivityCard({
  events,
  isPending,
  isError,
}: DashboardActivityCardProps) {
  return (
    <BentoCard label="Hoạt động gần đây" className="sm:col-span-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiActivity aria-hidden="true" className="h-4 w-4" />
        </span>
        Hoạt động thu tiền hôm nay
      </h3>
      {isPending && (
        <p
          aria-busy="true"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải hoạt động…
        </p>
      )}
      {isError && (
        <p className="mt-3 rounded-xl border border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Không tải được hoạt động. Vui lòng thử lại.
        </p>
      )}
      {events && events.length === 0 && (
        <p className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <FiClock aria-hidden="true" className="h-4 w-4" />
          Chưa có hoạt động thu tiền nào hôm nay.
        </p>
      )}
      {events && events.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {events.map((event) => {
            const Icon = ACTION_ICONS[event.action ?? ""] ?? FiClock;
            return (
              <li
                key={event.eventId}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {ACTION_LABELS[event.action ?? ""] ?? event.action ?? "—"}
                    {event.amount !== null
                      ? ` · ${new Intl.NumberFormat("vi-VN").format(event.amount)}đ`
                      : ""}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {event.at
                      ? formatDateTime(event.at, { withZoneSuffix: false })
                      : "—"}
                    {event.refType ? ` · ${event.refType}` : ""}
                    {event.refId ? ` ${event.refId.slice(0, 8)}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}
