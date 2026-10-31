"use client";

import { LabeledBarRows } from "@/components/charts/LabeledBarRows";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { StaffAsideArt } from "@/components/staff/StaffHeroArt";
import { STAFF_ART } from "@/components/staff/staff-art";
import { useNavigationBoard } from "@/hooks/mechanic";
import { formatDistanceKm, formatEtaMin } from "../mechanic-format";

const MAX_STOPS = 6;

// Distance to each pending stop, nearest first, with its ETA. Reuses the
// navigation board query, so a location update redraws the bars.
export function RouteDistanceChart() {
  const board = useNavigationBoard();
  const targets = [...(board.data?.board.targets ?? [])]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_STOPS);
  const totalKm = targets.reduce((sum, target) => sum + target.distanceKm, 0);

  return (
    <StaffChartCard
      title="Khoảng cách tới các điểm"
      subtitle="Điểm gần nhất ở trên cùng, kèm thời gian di chuyển dự kiến"
      isPending={board.isPending}
      empty={
        board.isError
          ? "Không tải được bảng điều hướng."
          : targets.length === 0
            ? "Chưa có điểm nào cần tới."
            : null
      }
      aside={
        <StaffAsideArt art={STAFF_ART.van}>
          <ChartHeadline
            value={formatDistanceKm(totalKm)}
            caption={`${targets.length} điểm`}
          />
        </StaffAsideArt>
      }
    >
      <LabeledBarRows
        rows={targets.map((target) => ({
          key: `${target.kind}-${target.bookingId}`,
          label: target.customerName || "Khách hàng",
          value: target.distanceKm,
          note: `${formatDistanceKm(target.distanceKm)} · ${formatEtaMin(target.etaMin)}`,
        }))}
        label={targets
          .map(
            (target) =>
              `${target.customerName}: ${formatDistanceKm(target.distanceKm)}`,
          )
          .join("; ")}
      />
    </StaffChartCard>
  );
}
