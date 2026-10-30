import { formatVnd } from "@/app/admin/components/services/catalog-format";

type VoucherTotalsProps = {
  subtotal: number;
  discount: number;
  travelFee?: number;
  total?: number;
};

// Receipt look shared by customer and staff screens: dashed rule above a
// big navy total.
const styles = {
  box: "rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900",
  totalRow:
    "flex items-baseline justify-between gap-3 border-t border-dashed border-zinc-400 pt-3 text-sm dark:border-zinc-600",
  total:
    "text-2xl font-extrabold tracking-tight text-[#1E3A5F] dark:text-zinc-50",
} as const;

export function VoucherTotals({
  subtotal,
  discount,
  travelFee = 0,
  total,
}: VoucherTotalsProps) {
  return (
    <dl
      aria-label="Tạm tính sau voucher"
      className={`flex flex-col gap-1.5 text-xs ${styles.box}`}
    >
      <div className="flex items-center justify-between gap-3">
        <dt className="text-zinc-500 dark:text-zinc-400">Giá dịch vụ</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
          {formatVnd(subtotal)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-zinc-500 dark:text-zinc-400">Giảm voucher</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
          {discount > 0 ? `−${formatVnd(discount)}` : "Chưa áp dụng"}
        </dd>
      </div>
      {travelFee > 0 && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">Phí di chuyển</dt>
          <dd className="font-medium text-zinc-800 dark:text-zinc-200">
            {formatVnd(travelFee)}
          </dd>
        </div>
      )}
      <div className={styles.totalRow}>
        <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
          Tổng tạm tính
        </dt>
        <dd className={styles.total}>
          {formatVnd(total ?? Math.max(0, subtotal - discount + travelFee))}
        </dd>
      </div>
    </dl>
  );
}
