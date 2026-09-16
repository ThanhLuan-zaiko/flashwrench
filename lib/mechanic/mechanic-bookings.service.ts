// Business logic behind the mechanic schedule: read the assigned workload,
// resolve booking details, and run workflow transitions with the side
// effects that follow (availability, completed-job counter, timeline).

import {
  type MechanicBookingDetail,
  type MechanicBookingItem,
  type MechanicBookingStatus,
  type MechanicBookingSummary,
  type MechanicFieldErrors,
  type MechanicResult,
  type MechanicWorkloadRow,
  toNumberOr,
} from "./mechanic.types";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
  listBookingRowsByIds,
  listStatusHistoryRows,
  listWorkloadRows,
  writeBookingStatus,
} from "./mechanic-bookings.repository";
import { syncMechanicDirectory } from "./mechanic-directory.service";
import {
  groupItemsByBooking,
  toBookingStatus,
  toBookingSummary,
  toTimelineEntry,
} from "./mechanic-mapper";
import {
  ACTION_TARGET_STATUS,
  availabilityAfterAction,
  canApplyAction,
  isMechanicBookingAction,
  type MechanicBookingAction,
  monthBucketOf,
  transitionError,
} from "./mechanic-status";
import {
  findMechanicProfileRow,
  setMechanicAvailability,
  setMechanicCompletedJobs,
} from "./mechanic-workspace.repository";

export const MECHANIC_BOOKING_LIMIT = 25;
export const MECHANIC_BOOKING_MAX_LIMIT = 60;
const HISTORY_LIMIT = 20;
const MAX_NOTE_LENGTH = 300;

export type MechanicBookingListParams = {
  status?: MechanicBookingStatus | "all";
  limit?: number;
};

function formError<T>(status: number, form: string): MechanicResult<T> {
  return { ok: false, status, errors: { form } };
}

function fieldError<T>(
  status: number,
  errors: MechanicFieldErrors,
): MechanicResult<T> {
  return { ok: false, status, errors };
}

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return MECHANIC_BOOKING_LIMIT;
  }
  return Math.min(Math.trunc(limit), MECHANIC_BOOKING_MAX_LIMIT);
}

function normalizeNote(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

// A booking whose status column cannot be parsed is skipped: showing a
// booking with the wrong workflow state would offer the wrong buttons.
function withKnownStatus(
  rows: MechanicWorkloadRow[],
): { row: MechanicWorkloadRow; status: MechanicBookingStatus }[] {
  const usable: { row: MechanicWorkloadRow; status: MechanicBookingStatus }[] =
    [];
  for (const row of rows) {
    const status = toBookingStatus(row.status);
    if (status) usable.push({ row, status });
  }
  return usable;
}

async function loadItemsByBooking(
  bookingIds: string[],
): Promise<Map<string, MechanicBookingItem[]>> {
  const rows = await listBookingItemRowsByBookingIds(bookingIds);
  return groupItemsByBooking(rows);
}

export async function listMechanicBookings(
  mechanicId: string,
  params: MechanicBookingListParams = {},
): Promise<MechanicResult<MechanicBookingSummary[]>> {
  const rows = await listWorkloadRows(mechanicId, resolveLimit(params.limit));
  const usable = withKnownStatus(rows);
  const selected =
    params.status && params.status !== "all"
      ? usable.filter((entry) => entry.status === params.status)
      : usable;
  const bookingIds = selected.map((entry) => entry.row.booking_id);

  const [details, itemsByBooking] = await Promise.all([
    listBookingRowsByIds(bookingIds),
    loadItemsByBooking(bookingIds),
  ]);
  const detailById = new Map(
    details.map((detail) => [detail.booking_id, detail]),
  );

  return {
    ok: true,
    data: selected.map((entry) =>
      toBookingSummary({
        workload: entry.row,
        detail: detailById.get(entry.row.booking_id) ?? null,
        items: itemsByBooking.get(entry.row.booking_id) ?? [],
        status: entry.status,
      }),
    ),
  };
}

// bookings_by_mechanic only carries the workload columns, so the row is
// reshaped into a workload row before mapping (same shape the list uses).
function workloadFromDetail(
  mechanicId: string,
  detail: Awaited<ReturnType<typeof findBookingRowById>>,
): MechanicWorkloadRow {
  return {
    mechanic_id: mechanicId,
    scheduled_at: detail?.scheduled_at ?? null,
    booking_id: detail?.booking_id ?? "",
    status: detail?.status ?? null,
    total: detail?.total ?? null,
    vehicle_plate: detail?.vehicle_plate ?? null,
    customer_name: detail?.customer_name ?? null,
  };
}

export async function getMechanicBookingDetail(
  mechanicId: string,
  bookingId: string,
): Promise<MechanicResult<MechanicBookingDetail>> {
  if (!bookingId) return formError(400, "Thiếu mã đơn hàng.");

  const detail = await findBookingRowById(bookingId);
  if (!detail) return formError(404, "Không tìm thấy đơn hàng này.");
  if (detail.mechanic_id !== mechanicId) {
    return formError(403, "Đơn hàng này không thuộc về bạn.");
  }
  const status = toBookingStatus(detail.status);
  if (!status) {
    return formError(400, "Đơn hàng đang ở trạng thái không xác định.");
  }

  const [itemRows, historyRows] = await Promise.all([
    listBookingItemRowsByBookingIds([bookingId]),
    listStatusHistoryRows(bookingId, HISTORY_LIMIT),
  ]);
  const items = groupItemsByBooking(itemRows).get(bookingId) ?? [];
  const summary = toBookingSummary({
    workload: workloadFromDetail(mechanicId, detail),
    detail,
    items,
    status,
  });

  return {
    ok: true,
    data: {
      ...summary,
      items,
      timeline: historyRows
        .map(toTimelineEntry)
        .filter((entry) => entry !== null),
      cancelReason: detail.cancel_reason ?? "",
    },
  };
}

export type MechanicActionOutcome = {
  booking: MechanicBookingSummary;
  customerId: string | null;
};

// One transition = four writes in a single batch (booking row, workload
// row, dispatcher status bucket, timeline) plus the side effects that
// belong to the action. Availability and the completion counter are only
// touched after the status write succeeded.
export async function applyMechanicBookingAction(
  mechanicId: string,
  bookingId: string,
  actionInput: unknown,
  noteInput?: unknown,
): Promise<MechanicResult<MechanicActionOutcome>> {
  if (!bookingId) return fieldError(400, { form: "Thiếu mã đơn hàng." });
  if (!isMechanicBookingAction(actionInput)) {
    return fieldError(400, { action: "Thao tác không hợp lệ." });
  }
  const action: MechanicBookingAction = actionInput;
  const note = normalizeNote(noteInput);
  if (note.length > MAX_NOTE_LENGTH) {
    return fieldError(400, {
      note: `Ghi chú tối đa ${MAX_NOTE_LENGTH} ký tự.`,
    });
  }

  const detail = await findBookingRowById(bookingId);
  if (!detail) return formError(404, "Không tìm thấy đơn hàng này.");
  if (detail.mechanic_id !== mechanicId) {
    return formError(403, "Đơn hàng này không thuộc về bạn.");
  }
  const current = toBookingStatus(detail.status);
  if (!current) {
    return formError(400, "Đơn hàng đang ở trạng thái không xác định.");
  }
  if (!canApplyAction(action, current)) {
    return fieldError(400, { action: transitionError(action, current) });
  }

  const target = ACTION_TARGET_STATUS[action];
  const now = new Date();
  await writeBookingStatus({
    bookingId,
    mechanicId,
    scheduledAt: detail.scheduled_at,
    monthBucket: monthBucketOf(detail.scheduled_at ?? now),
    fromStatus: current,
    toStatus: target,
    customerId: detail.customer_id,
    zoneId: detail.zone_id,
    total: detail.total,
    changedBy: mechanicId,
    note: note.length > 0 ? note : null,
  });

  const availability = availabilityAfterAction(action);
  if (availability !== null) {
    await setMechanicAvailability(mechanicId, availability, now);
    // Availability flips change bookability: refresh the customer-facing
    // directory in the same flow so the picker never offers a busy
    // mechanic (or hides one that just freed up).
    await syncMechanicDirectory(mechanicId);
  }
  if (action === "complete") {
    const profile = await findMechanicProfileRow(mechanicId);
    await setMechanicCompletedJobs(
      mechanicId,
      toNumberOr(profile?.completed_jobs) + 1,
      now,
    );
  }

  // Read back so the response carries the timestamp the write produced.
  const refreshed = (await findBookingRowById(bookingId)) ?? {
    ...detail,
    status: target,
    updated_at: now,
  };
  const items = await loadItemsByBooking([bookingId]);
  return {
    ok: true,
    data: {
      booking: toBookingSummary({
        workload: workloadFromDetail(mechanicId, refreshed),
        detail: refreshed,
        items: items.get(bookingId) ?? [],
        status: target,
      }),
      customerId: detail.customer_id,
    },
  };
}
