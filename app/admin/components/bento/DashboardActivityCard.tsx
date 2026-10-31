import { FiLoader } from "react-icons/fi";
import { StaffEmptyState } from "@/components/staff/StaffEmptyState";
import { STAFF_ART } from "@/components/staff/staff-art";
import { formatDateTime } from "@/lib/datetime/format";
import type { PaymentAuditEvent } from "@/lib/revenue/revenue.types";
import { BentoCard } from "./BentoCard";

const ACTION_TAGS: Record<string, string> = {
  recorded: "Thu tiền",
  confirm_code_issued: "Cấp mã",
  confirm_failed: "Sai mã",
  refund_marked: "Hoàn tiền",
};

const REF_LABELS: Record<string, string> = {
  booking: "đơn sửa",
  order: "đơn linh kiện",
  emergency: "cứu hộ",
};

type DashboardActivityCardProps = {
  events: PaymentAuditEvent[] | undefined;
  isPending: boolean;
  isError: boolean;
};

function describe(event: PaymentAuditEvent): string {
  const ref = event.refType ? (REF_LABELS[event.refType] ?? event.refType) : "";
  const code = event.refId ? ` ${event.refId.slice(0, 8).toUpperCase()}` : "";
  const amount =
    event.amount !== null
      ? ` · ${new Intl.NumberFormat("vi-VN").format(event.amount)}đ`
      : "";
  return `${ref}${code}${amount}`.trim() || "Sự kiện thanh toán";
}

// Live feed of today's payment events, newest first — each row is a tag,
// the reference and the time. Refreshes on the operations feed.
export function DashboardActivityCard({
  events,
  isPending,
  isError,
}: DashboardActivityCardProps) {
  return (
    <BentoCard label="Hoạt động mới" tour="admin-dash-activity">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
          Hoạt động mới
        </h3>
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A5F] dark:text-zinc-100">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[#1E3A5F] dark:bg-zinc-100"
          />
          Trực tiếp
        </span>
      </div>
      {isPending && (
        <p
          aria-busy="true"
          className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải hoạt động…
        </p>
      )}
      {isError && (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Không tải được hoạt động. Vui lòng thử lại.
        </p>
      )}
      {events && events.length === 0 && (
        <StaffEmptyState
          art={STAFF_ART.coins}
          title="Chưa có hoạt động thu tiền nào hôm nay"
        />
      )}
      {events && events.length > 0 && (
        <ul aria-live="polite" className="mt-2">
          {events.map((event) => {
            const failed = event.action === "confirm_failed";
            return (
              <li
                key={event.eventId}
                className="flex items-center gap-2.5 border-t border-zinc-100 py-2.5 dark:border-zinc-900"
              >
                <span
                  className={`w-[76px] shrink-0 rounded-full border border-zinc-200 py-0.5 text-center text-[11px] font-bold dark:border-zinc-800 ${
                    failed
                      ? "text-red-600 dark:text-red-400"
                      : "text-[#1E3A5F] dark:text-zinc-200"
                  }`}
                >
                  {ACTION_TAGS[event.action ?? ""] ?? "Khác"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-700 dark:text-zinc-300">
                  {describe(event)}
                </span>
                <span className="shrink-0 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  {event.at
                    ? formatDateTime(event.at, { withZoneSuffix: false })
                    : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}
