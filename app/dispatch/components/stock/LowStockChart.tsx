"use client";

import { LabeledBarRows } from "@/components/charts/LabeledBarRows";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useDispatchParts } from "@/hooks/dispatch-orders";
import { lowestStock } from "@/lib/staff-charts/page-series";

const LOW_STOCK_AT = 5;

// The six active parts closest to running out; reuses the stock board's
// part list query, so stock edits redraw the bars in place.
export function LowStockChart() {
  const parts = useDispatchParts();
  const list = parts.data?.parts ?? [];
  const lowest = lowestStock(list);
  const lowCount = list.filter(
    (part) => part.isActive && part.stockQty <= LOW_STOCK_AT,
  ).length;

  return (
    <StaffChartCard
      title="Linh kiện sắp hết"
      subtitle={`Tồn thấp nhất trong kho · cảnh báo khi còn từ ${LOW_STOCK_AT} trở xuống`}
      isPending={parts.isPending}
      empty={
        parts.isError
          ? "Không tải được tồn kho."
          : lowest.length === 0
            ? "Chưa có linh kiện nào đang bán."
            : null
      }
      aside={<ChartHeadline value={String(lowCount)} caption="mã sắp hết" />}
    >
      <LabeledBarRows
        rows={lowest.map((row) => ({
          ...row,
          note: row.value <= 0 ? "Hết hàng" : `${row.value} cái`,
        }))}
        label={lowest.map((row) => `${row.label}: ${row.value}`).join("; ")}
      />
    </StaffChartCard>
  );
}
