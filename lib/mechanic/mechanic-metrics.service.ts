import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import {
  captureMechanicBookingRows,
  captureMechanicMetrics,
  captureMechanicRatings,
} from "@/lib/operations/metric-capture.service";
import type { MechanicIncomeState } from "./mechanic.types";
import { mechanicIncomeSnapshot } from "./mechanic-income-metrics";
import {
  type MechanicIncomeSnapshot,
  type MechanicStatsSnapshot,
  validMetricPaging,
} from "./mechanic-metrics.types";
import { mechanicStatsSnapshot } from "./mechanic-stats-metrics";

export async function getPublicMechanicMetrics(mechanicId: string): Promise<{
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
}> {
  const [rows, ratings] = await Promise.all([
    captureMechanicBookingRows(mechanicId),
    captureMechanicRatings(mechanicId),
  ]);
  return {
    ratingAvg: ratings.average,
    ratingCount: ratings.count,
    completedJobs: rows.filter((row) => row.status === "completed").length,
  };
}

export type IncomeMetricParams = {
  limit?: number;
  page?: number;
  state?: string;
  now?: Date;
};

export async function getMechanicIncomeMetrics(
  mechanicId: string,
  params: IncomeMetricParams = {},
): Promise<WorkspaceResult<MechanicIncomeSnapshot>> {
  const page = params.page ?? 1;
  const pageSize = params.limit ?? 8;
  const state = params.state ?? "all";
  if (
    !validMetricPaging(page, pageSize) ||
    !["all", "paid", "pending", "refunded"].includes(state)
  ) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Bộ lọc hoặc trang thu nhập không hợp lệ." },
    };
  }
  const captured = await captureMechanicMetrics(mechanicId);
  return {
    ok: true,
    data: mechanicIncomeSnapshot(captured, params.now ?? new Date(), {
      page,
      pageSize,
      state: state as MechanicIncomeState | "all",
    }),
  };
}

export async function getMechanicStatsMetrics(
  mechanicId: string,
  params: { reviewPage?: number; now?: Date } = {},
): Promise<WorkspaceResult<MechanicStatsSnapshot>> {
  const reviewPage = params.reviewPage ?? 1;
  if (!validMetricPaging(reviewPage, 5)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Trang đánh giá không hợp lệ." },
    };
  }
  const [captured, ratings] = await Promise.all([
    captureMechanicMetrics(mechanicId),
    captureMechanicRatings(mechanicId),
  ]);
  return {
    ok: true,
    data: mechanicStatsSnapshot(
      captured,
      ratings,
      params.now ?? new Date(),
      reviewPage,
    ),
  };
}
