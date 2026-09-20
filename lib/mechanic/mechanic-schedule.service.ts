import { mapBookingSummaries } from "@/lib/booking/booking-reader.service";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { captureMechanicBookingRows } from "@/lib/operations/metric-capture.service";
import type {
  MechanicBookingStatus,
  MechanicBookingSummary,
} from "./mechanic.types";
import {
  type MetricPagination,
  metricPagination,
  validMetricPaging,
} from "./mechanic-metrics.types";
import { dayKey } from "./mechanic-period";
import {
  isOpenBookingStatus,
  MECHANIC_BOOKING_STATUSES,
  parseBookingStatus,
} from "./mechanic-status";

export type MechanicSchedulePayload = {
  bookings: MechanicBookingSummary[];
  counts: Record<MechanicBookingStatus | "all", number>;
  pagination: MetricPagination;
  overview: { today: number; pending: number; open: number; completed: number };
};

export async function getMechanicSchedule(
  mechanicId: string,
  params: { status?: string; page?: number; limit?: number; now?: Date } = {},
): Promise<WorkspaceResult<MechanicSchedulePayload>> {
  const status = params.status ?? "all";
  const page = params.page ?? 1;
  const size = params.limit ?? 8;
  if (
    (status !== "all" && !parseBookingStatus(status)) ||
    !validMetricPaging(page, size)
  ) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Bộ lọc hoặc trang lịch hẹn không hợp lệ." },
    };
  }
  const now = params.now ?? new Date();
  const rows = (await captureMechanicBookingRows(mechanicId))
    .filter((row) => parseBookingStatus(row.status))
    .sort(
      (left, right) =>
        (right.scheduled_at?.getTime() ?? 0) -
          (left.scheduled_at?.getTime() ?? 0) ||
        left.booking_id.localeCompare(right.booking_id),
    );
  const counts = Object.fromEntries(
    ["all", ...MECHANIC_BOOKING_STATUSES].map((key) => [key, 0]),
  ) as MechanicSchedulePayload["counts"];
  const overview = { today: 0, pending: 0, open: 0, completed: 0 };
  for (const row of rows) {
    const current = parseBookingStatus(row.status);
    if (!current) continue;
    counts[current] += 1;
    counts.all += 1;
    if (isOpenBookingStatus(current)) overview.open += 1;
    if (current === "pending") overview.pending += 1;
    if (current === "completed") overview.completed += 1;
    if (
      row.scheduled_at &&
      dayKey(row.scheduled_at, row.timezone ?? undefined) ===
        dayKey(now, row.timezone ?? undefined)
    )
      overview.today += 1;
  }
  const selected =
    status === "all" ? rows : rows.filter((row) => row.status === status);
  const pagination = metricPagination(selected.length, page, size);
  const offset = (pagination.page - 1) * pagination.pageSize;
  return {
    ok: true,
    data: {
      bookings: await mapBookingSummaries(
        selected.slice(offset, offset + size),
      ),
      counts,
      pagination,
      overview,
    },
  };
}
