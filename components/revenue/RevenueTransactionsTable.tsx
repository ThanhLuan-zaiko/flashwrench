import { formatDateTime } from "@/lib/datetime/format";
import type { RevenueTransaction } from "@/lib/revenue/revenue.types";
import { formatVnd, sliceLabel } from "./revenue-format";

type RevenueTransactionsTableProps = {
  items: RevenueTransaction[];
  truncated: boolean;
  /** Admin view adds the collector/recorder/confirmation columns. */
  showStaff: boolean;
};

const TH =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const TD = "px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300";

// Receipt-level table, client-paged by the parent. Staff columns stay
// admin-only: dispatchers get amounts and sources, never accountability.
export function RevenueTransactionsTable({
  items,
  truncated,
  showStaff,
}: RevenueTransactionsTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Chưa có giao dịch trong kỳ này.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th scope="col" className={TH}>
              Thời gian
            </th>
            <th scope="col" className={TH}>
              Nguồn
            </th>
            <th scope="col" className={TH}>
              Số tiền
            </th>
            <th scope="col" className={TH}>
              Phương thức
            </th>
            {showStaff && (
              <th scope="col" className={TH}>
                Thợ thu
              </th>
            )}
            {showStaff && (
              <th scope="col" className={TH}>
                Khách xác nhận
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((t) => (
            <tr key={t.paymentId}>
              <td className={TD}>
                {t.paidAt
                  ? formatDateTime(t.paidAt, { withZoneSuffix: false })
                  : "—"}
              </td>
              <td className={TD}>{sliceLabel("source", t.refType)}</td>
              <td
                className={`${TD} font-semibold text-zinc-900 dark:text-zinc-50`}
              >
                {formatVnd(t.amount)}
              </td>
              <td className={TD}>{sliceLabel("method", t.method ?? "")}</td>
              {showStaff && <td className={TD}>{t.mechanicId ?? "—"}</td>}
              {showStaff && (
                <td className={TD}>
                  {t.customerConfirmed === null
                    ? "—"
                    : t.customerConfirmed
                      ? "Đã xác nhận"
                      : "Chưa"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && (
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Danh sách bị cắt bớt do vượt giới hạn hiển thị.
        </p>
      )}
    </div>
  );
}
