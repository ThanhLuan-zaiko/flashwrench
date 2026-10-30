"use client";

import { ColumnChart } from "@/components/charts/ColumnChart";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useCatalogServices } from "@/hooks/service-catalog";
import { groupTotals } from "@/lib/staff-charts/page-series";

const MAX_COLUMNS = 8;

// Live services per category (trash excluded). Reuses the catalog
// overview query, so creating or moving a service redraws the columns.
export function ServicesByCategoryChart() {
  const services = useCatalogServices({ includeDeleted: true });
  const live = (services.data?.services ?? []).filter(
    (service) => !service.isDeleted,
  );
  const groups = groupTotals(
    live,
    (service) => service.categoryId,
    (service) => service.categoryName || "Chưa phân nhóm",
  ).slice(0, MAX_COLUMNS);

  return (
    <StaffChartCard
      title="Dịch vụ theo nhóm"
      subtitle="Số dịch vụ đang có trong từng nhóm"
      isPending={services.isPending}
      empty={
        services.isError
          ? "Không tải được danh mục dịch vụ."
          : groups.length === 0
            ? "Chưa có dịch vụ nào."
            : null
      }
      aside={<ChartHeadline value={String(live.length)} caption="dịch vụ" />}
    >
      <ColumnChart
        values={groups.map((group) => group.value)}
        labels={groups.map((group) => group.label)}
        label={groups.map((g) => `${g.label}: ${g.value}`).join("; ")}
        className="h-44 w-full"
      />
    </StaffChartCard>
  );
}
