import { FiLoader, FiShield } from "react-icons/fi";
import { formatDateTime } from "@/lib/datetime/format";
import type { PaymentAuditEvent } from "@/lib/revenue/revenue.types";
import { BentoCard } from "../bento/BentoCard";

const ACTION_LABELS: Record<string, string> = {
  recorded: "Ghi nhận thu tiền",
  confirm_code_issued: "Cấp mã xác nhận",
  confirm_failed: "Sai mã xác nhận",
  refund_marked: "Đánh dấu hoàn tiền",
};

type AuditFeedCardProps = {
  events: PaymentAuditEvent[] | undefined;
  label: string | undefined;
  isPending: boolean;
  isError: boolean;
};

function formatVnd(amount: number | null): string {
  if (amount === null) return "";
  return ` · ${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

// Admin-only audit feed: every payment-side event (receipts, code issues,
// failed confirmations, refund marks) in the selected range.
export function AuditFeedCard({
  events,
  label,
  isPending,
  isError,
}: AuditFeedCardProps) {
  return (
    <BentoCard
      label="Nhật ký thanh toán"
      tour="admin-audit"
      className="sm:col-span-2 lg:col-span-4"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <FiShield aria-hidden="true" className="h-4 w-4" />
        Nhật ký thu tiền{label ? ` — ${label}` : ""}
      </p>
      {isPending && (
        <p
          aria-busy="true"
          className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải nhật ký…
        </p>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Không tải được nhật ký. Vui lòng thử lại.
        </p>
      )}
      {events && events.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Chưa có sự kiện nào trong kỳ này.
        </p>
      )}
      {events && events.length > 0 && (
        <ol className="mt-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {events.map((event) => (
            <li key={event.eventId} className="py-2.5 text-xs">
              <p className="flex flex-wrap items-center gap-x-2 text-zinc-800 dark:text-zinc-200">
                <span className="font-semibold">
                  {ACTION_LABELS[event.action ?? ""] ?? event.action ?? "—"}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {event.at
                    ? formatDateTime(event.at, { withZoneSuffix: false })
                    : "—"}
                  {formatVnd(event.amount)}
                </span>
              </p>
              <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                {event.refType ?? ""} {event.refId ?? ""}
                {event.actorId ? ` · bởi ${event.actorId}` : ""}
                {event.detail ? ` · ${event.detail}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </BentoCard>
  );
}
