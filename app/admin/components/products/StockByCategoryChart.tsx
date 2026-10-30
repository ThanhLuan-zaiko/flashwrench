"use client";

import { LabeledBarRows } from "@/components/charts/LabeledBarRows";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useAdminParts } from "@/hooks/admin-parts";
import { groupTotals } from "@/lib/staff-charts/page-series";

const MAX_ROWS = 6;

// Units in stock per part category (live parts only). Reuses the products
// overview query, which the parts realtime feed keeps fresh.
export function StockByCategoryChart() {
  const parts = useAdminParts({ includeDeleted: true });
  const live = (parts.data?.parts ?? []).filter((part) => !part.isDeleted);
  const groups = groupTotals(
    live,
    (part) => part.categoryId,
    (part) => part.categoryName || "Chưa phân loại",
    (part) => Math.max(0, part.stockQty),
  ).slice(0, MAX_ROWS);
  const units = live.reduce((sum, part) => sum + Math.max(0, part.stockQty), 0);

  return (
    <StaffChartCard
      title="Tồn kho theo danh mục"
      subtitle="Tổng số linh kiện còn trong kho của mỗi danh mục"
      isPending={parts.isPending}
      empty={
        parts.isError
          ? "Không tải được sản phẩm."
          : groups.length === 0
            ? "Chưa có linh kiện nào."
            : null
      }
      aside={
        <ChartHeadline value={String(units)} caption="linh kiện trong kho" />
      }
    >
      <LabeledBarRows
        rows={groups.map((group) => ({ ...group, note: `${group.value} cái` }))}
        label={groups.map((g) => `${g.label}: ${g.value}`).join("; ")}
      />
    </StaffChartCard>
  );
}
