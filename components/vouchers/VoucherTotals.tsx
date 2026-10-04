import { formatVnd } from "@/app/admin/components/services/catalog-format";

type VoucherTotalsProps = {
  subtotal: number;
  discount: number;
  travelFee?: number;
  total?: number;
};

export function VoucherTotals({
  subtotal,
  discount,
  travelFee = 0,
  total,
}: VoucherTotalsProps) {
  return (
    <dl
      aria-label="Tạm tính sau voucher"
      className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800"
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
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2 text-sm dark:border-zinc-800">
        <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
          Tổng tạm tính
        </dt>
        <dd className="font-bold text-zinc-900 dark:text-zinc-50">
          {formatVnd(total ?? Math.max(0, subtotal - discount + travelFee))}
        </dd>
      </div>
    </dl>
  );
}
