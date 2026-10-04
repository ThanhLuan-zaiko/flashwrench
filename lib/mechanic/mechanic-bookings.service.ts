// Business logic behind the mechanic schedule: read the assigned workload,
// resolve booking details, and run workflow transitions with the side
// effects that follow (availability, completed-job counter, timeline).

import {
  nextTransitionAt,
  transitionBooking,
} from "@/lib/booking/booking-workflow.service";
import { redispatchAfterDecline } from "@/lib/dispatch/auto-dispatch.service";
import { isUuid } from "@/lib/validation";
import { handleVoucherBookingCompleted } from "@/lib/vouchers/auto-grant.service";
import { publishWalletChange } from "@/lib/vouchers/voucher-realtime";
import { restoreWalletForRef } from "@/lib/vouchers/voucher-spend.service";
import type {
  MechanicBookingItem,
  MechanicBookingStatus,
  MechanicBookingSummary,
  MechanicFieldErrors,
  MechanicResult,
  MechanicWorkloadRow,
} from "./mechanic.types";
import {
  hasActiveBooking,
  mechanicScheduleConflict,
  releaseMechanicIfIdle,
  releaseMechanicJob,
  releaseReservationIfUnclaimed,
  reserveMechanicJob,
} from "./mechanic-assignment.service";
import { writeBookingCompletionEffects } from "./mechanic-booking-effects.service";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
  listBookingRowsByIds,
  listWorkloadRows,
} from "./mechanic-bookings.repository";
import { syncMechanicDirectory } from "./mechanic-directory.service";
import {
  groupItemsByBooking,
  toBookingStatus,
  toBookingSummary,
  workloadFromDetail,
} from "./mechanic-mapper";
import {
  ACTION_TARGET_STATUS,
  availabilityAfterAction,
  canApplyAction,
  isMechanicBookingAction,
  type MechanicBookingAction,
  transitionError,
} from "./mechanic-status";
import {
  findMechanicProfileRow,
  setMechanicAvailability,
} from "./mechanic-workspace.repository";

export const MECHANIC_BOOKING_LIMIT = 25;
export const MECHANIC_BOOKING_MAX_LIMIT = 60;
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
  const details = await listBookingRowsByIds(rows.map((row) => row.booking_id));
  const detailById = new Map(
    details.map((detail) => [detail.booking_id, detail]),
  );
  const usable: {
    workload: MechanicWorkloadRow;
    detail: (typeof details)[number];
    status: MechanicBookingStatus;
  }[] = [];
  // A booking whose status column cannot be parsed is skipped: showing a
  // booking with the wrong workflow state would offer the wrong buttons.
  for (const row of rows) {
    const detail = detailById.get(row.booking_id);
    if (!detail || detail.mechanic_id !== mechanicId) continue;
    const status = toBookingStatus(detail.status);
    if (status) usable.push({ workload: row, detail, status });
  }
  const selected =
    params.status && params.status !== "all"
      ? usable.filter((entry) => entry.status === params.status)
      : usable;
  const itemsByBooking = await loadItemsByBooking(
    selected.map((entry) => entry.detail.booking_id),
  );

  return {
    ok: true,
    data: selected.map((entry) =>
      toBookingSummary({
        workload: entry.workload,
        detail: entry.detail,
        items: itemsByBooking.get(entry.detail.booking_id) ?? [],
        status: entry.status,
      }),
    ),
  };
}

export type MechanicActionOutcome = {
  booking: MechanicBookingSummary;
  customerId: string | null;
  previousMechanicId: string | null;
  nextMechanicId: string | null;
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
  if (!isUuid(bookingId)) {
    return fieldError(400, { form: "Mã đơn hàng không hợp lệ." });
  }
  if (!isMechanicBookingAction(actionInput)) {
    return fieldError(400, { action: "Thao tác không hợp lệ." });
  }
  const action: MechanicBookingAction = actionInput;
  if (
    noteInput !== undefined &&
    noteInput !== null &&
    typeof noteInput !== "string"
  ) {
    return fieldError(400, { note: "Ghi chú không hợp lệ." });
  }
  const note =
    typeof noteInput === "string" ? noteInput.trim().replace(/\s+/g, " ") : "";
  if (note.length > MAX_NOTE_LENGTH) {
    return fieldError(400, {
      note: `Ghi chú tối đa ${MAX_NOTE_LENGTH} ký tự.`,
    });
  }
  if (
    note.length === 0 &&
    (action === "decline" || action === "cancel" || action === "mark-no-show")
  ) {
    return fieldError(400, { note: "Vui lòng nhập lý do." });
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

  if (action === "accept") {
    const conflict = await mechanicScheduleConflict(
      mechanicId,
      detail.scheduled_at ?? new Date(),
      bookingId,
      detail.duration_min,
    );
    if (conflict !== false)
      return formError(
        409,
        "Lịch hẹn này trùng một lịch hẹn khác. Vui lòng liên hệ điều phối để chọn lại khung giờ.",
      );
  }

  const needsReservation = action === "start-travel" || action === "start-work";
  let acquiredReservation = false;
  if (needsReservation) {
    if (await hasActiveBooking(mechanicId, bookingId)) {
      return formError(
        409,
        "Bạn đang có đơn đang di chuyển hoặc đang sửa. Hoàn thành đơn đó trước.",
      );
    }
    const reservation = await reserveMechanicJob(mechanicId, bookingId);
    if (!reservation.allowed) {
      return formError(
        409,
        "Bạn đang có đơn đang di chuyển hoặc đang sửa. Hoàn thành đơn đó trước.",
      );
    }
    acquiredReservation = reservation.acquired;
  }

  const target = ACTION_TARGET_STATUS[action];
  const releasesAssignment = action === "decline";
  let mechanicName = detail.mechanic_name;
  if (!releasesAssignment && !mechanicName) {
    const profile = await findMechanicProfileRow(mechanicId);
    mechanicName = profile?.display_name?.trim() || "Thợ FlashWrench";
  }
  const nextMechanicId = releasesAssignment ? null : mechanicId;
  const nextMechanicName = releasesAssignment ? null : mechanicName;

  const now = nextTransitionAt(detail);
  const transition = await transitionBooking({
    before: detail,
    status: target,
    mechanicId: nextMechanicId,
    mechanicName: nextMechanicName,
    actorId: mechanicId,
    note: note.length > 0 ? note : null,
    at: now,
  });
  if (!transition.ok) {
    if (acquiredReservation) {
      await releaseReservationIfUnclaimed(mechanicId, bookingId);
    }
    return { ok: false, status: transition.status, errors: transition.errors };
  }

  const itemsByBooking = await loadItemsByBooking([bookingId]);
  const items = itemsByBooking.get(bookingId) ?? [];
  const availability = availabilityAfterAction(action);
  const endsInvolvement =
    action === "decline" ||
    action === "cancel" ||
    action === "mark-no-show" ||
    action === "complete";
  if (endsInvolvement) {
    if (action === "decline") {
      await releaseMechanicJob(mechanicId, bookingId);
      await redispatchAfterDecline(bookingId, mechanicId);
    } else {
      await releaseMechanicIfIdle(mechanicId, bookingId, now);
    }
  }
  if (action === "complete") {
    await writeBookingCompletionEffects(
      mechanicId,
      detail,
      items,
      now,
      nextMechanicName,
    );
    // Loyalty automation: a completed booking ticks the customer rollup
    // and evaluates count/spend voucher rules. Best-effort, never throws.
    if (detail.customer_id) {
      await handleVoucherBookingCompleted(
        detail.customer_id,
        detail.total ?? 0,
      ).catch(() => undefined);
    }
  }
  // A mechanic-side cancel or no-show voids the visit, so the spent
  // wallet comes back to the customer just like a customer cancel.
  if (
    (action === "cancel" || action === "mark-no-show") &&
    detail.coupon_code &&
    detail.customer_id
  ) {
    await restoreWalletForRef({
      walletId: detail.coupon_code,
      userId: detail.customer_id,
      bookingId,
    });
    void publishWalletChange({
      kind: "voucher-granted",
      walletId: detail.coupon_code,
      userId: detail.customer_id,
    });
  }
  if (!endsInvolvement && availability !== null) {
    await setMechanicAvailability(mechanicId, availability, now);
  }
  if (availability !== null || action === "complete") {
    // Availability flips change bookability: refresh the customer-facing
    // directory in the same flow so the picker never offers a busy
    // mechanic (or hides one that just freed up).
    await syncMechanicDirectory(mechanicId);
  }

  // Read back so the response carries the timestamp the write produced.
  const refreshed = (await findBookingRowById(bookingId)) ?? transition.data;
  return {
    ok: true,
    data: {
      booking: toBookingSummary({
        workload: workloadFromDetail(mechanicId, refreshed),
        detail: refreshed,
        items,
        status: toBookingStatus(refreshed.status) ?? target,
      }),
      customerId: detail.customer_id,
      previousMechanicId: detail.mechanic_id,
      nextMechanicId,
    },
  };
}
