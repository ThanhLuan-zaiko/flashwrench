import {
  formatDuration,
  formatVnd,
} from "@/app/admin/components/services/catalog-format";

type BookingPriceSummaryProps = {
  subtotal: number;
  durationMin: number;
  unitPricing: boolean;
};

export function BookingPriceSummary({
  subtotal,
  durationMin,
  unitPricing,
}: BookingPriceSummaryProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-600 dark:text-zinc-300">
            Giá dịch vụ tạm tính
          </dt>
          <dd className="font-bold text-zinc-900 dark:text-zinc-50">
            {formatVnd(subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <dt className="text-zinc-500 dark:text-zinc-400">
            Tổng thời lượng dự kiến
          </dt>
          <dd className="font-semibold text-zinc-700 dark:text-zinc-200">
            {formatDuration(durationMin)}
          </dd>
        </div>
      </dl>
      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Chưa trừ voucher. Phụ tùng phát sinh và phí di chuyển được xác nhận
        riêng cho cả lịch hẹn.
        {unitPricing &&
          " Dịch vụ tính theo giờ hoặc theo mục đang tạm tính cho 1 đơn vị."}
      </p>
    </div>
  );
}
