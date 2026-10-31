"use client";

import { ColumnChart } from "@/components/charts/ColumnChart";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { StaffHeroArt } from "@/components/staff/StaffHeroArt";
import { STAFF_ART } from "@/components/staff/staff-art";
import { useDispatchPulse } from "@/hooks/dispatch-pulse";
import { useNow } from "@/hooks/useNow";
import { formatWait, RESCUE_LABELS } from "../pulse/pulse-format";

// Open rescues by stage, plus the mean wait of the listed open requests.
// Reuses the dispatch pulse query, so it refreshes on the operations feed.
export function RescueLoadChart() {
  const pulse = useDispatchPulse();
  const now = useNow(1000);
  const data = pulse.data;
  const total = data?.rescues.reduce((sum, step) => sum + step.count, 0) ?? 0;
  const waits = (data?.openRescues ?? []).map(
    (rescue) => now - new Date(rescue.createdAt).getTime(),
  );
  const meanWait =
    waits.length > 0 ? waits.reduce((a, b) => a + b, 0) / waits.length : null;

  return (
    <StaffChartCard
      title="Cứu hộ theo trạng thái"
      subtitle="Các yêu cầu chưa kết thúc"
      isPending={pulse.isPending}
      empty={pulse.isError ? "Không tải được số liệu cứu hộ." : null}
      aside={
        <div className="flex items-center gap-4">
          <StaffHeroArt art={STAFF_ART.towTruck} />
          <ChartHeadline
            value={String(total)}
            caption={
              meanWait === null
                ? "ca đang mở"
                : `ca đang mở · chờ TB ${formatWait(meanWait)}`
            }
          />
        </div>
      }
    >
      {data && (
        <ColumnChart
          values={data.rescues.map((step) => step.count)}
          labels={data.rescues.map((step) => RESCUE_LABELS[step.stage])}
          label={data.rescues
            .map((step) => `${RESCUE_LABELS[step.stage]}: ${step.count}`)
            .join("; ")}
          className="h-40 w-full"
        />
      )}
    </StaffChartCard>
  );
}
