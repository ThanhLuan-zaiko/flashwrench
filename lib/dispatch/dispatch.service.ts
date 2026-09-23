import type { PublicUser } from "@/lib/auth/user.types";
import {
  mapBookingSummaries,
  readBookingDetail,
} from "@/lib/booking/booking-reader.service";
import {
  MAX_BOOKING_SEARCH_LENGTH,
  matchesBookingSearch,
  normalizeBookingSearch,
} from "@/lib/booking/booking-search";
import {
  nextTransitionAt,
  transitionBooking,
} from "@/lib/booking/booking-workflow.service";
import type {
  BookingDetail,
  BookingSummary,
  CursorPage,
  WorkspaceResult,
} from "@/lib/booking/workspace.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { autoDispatchBooking } from "@/lib/dispatch/auto-dispatch.service";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";
import {
  isMechanicEligible,
  mechanicScheduleConflict,
  releaseMechanicIfIdle,
} from "@/lib/mechanic/mechanic-assignment.service";
import {
  findBookingRowById,
  listBookingRowsByIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { isMechanicBookingStatus } from "@/lib/mechanic/mechanic-status";
import { findMechanicProfileRow } from "@/lib/mechanic/mechanic-workspace.repository";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { isRecord, isUuid } from "@/lib/validation";
import { listStatusBookingRefs } from "./dispatch.repository";
import type { DispatchAction, DispatchListParams } from "./dispatch.types";
import { DISPATCH_DEFAULT_STATUS } from "./dispatch.types";

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;
const MAX_CANCEL_NOTE = 300;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const ASSIGNABLE_STATUSES = new Set<MechanicBookingStatus>([
  "pending",
  "confirmed",
  "mechanic_assigned",
]);

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function fieldFail<T>(
  status: number,
  errors: Record<string, string>,
): WorkspaceResult<T> {
  return { ok: false, status, errors };
}

function isDispatcher(actor: PublicUser): boolean {
  return actor.role === "dispatcher" || actor.role === "admin";
}

function listScope(
  actorId: string,
  status: string,
  month: string,
  search: string,
): string {
  const scope = `dispatch:${actorId}:${status}:${month}`;
  return search ? `${scope}:search:${search}` : scope;
}

export async function listDispatchBookings(
  actor: PublicUser,
  params: DispatchListParams = {},
): Promise<WorkspaceResult<CursorPage<BookingSummary>>> {
  if (!isDispatcher(actor)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const status = params.status ?? DISPATCH_DEFAULT_STATUS;
  if (!isMechanicBookingStatus(status)) {
    return fieldFail(400, { status: "Trạng thái không hợp lệ." });
  }
  const month = params.month ?? monthKey(new Date(), MECHANIC_TIME_ZONE);
  if (!MONTH_PATTERN.test(month)) {
    return fieldFail(400, { month: "Tháng không hợp lệ (YYYY-MM)." });
  }
  let limit = DEFAULT_PAGE_SIZE;
  if (params.limit !== undefined && params.limit !== null) {
    const parsed = Number(params.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
      return fieldFail(400, { limit: "Số lượng không hợp lệ." });
    }
    limit = parsed;
  }
  const rawSearch = params.search ?? "";
  if (
    typeof rawSearch !== "string" ||
    rawSearch.length > MAX_BOOKING_SEARCH_LENGTH
  ) {
    return fieldFail(400, { search: "Từ khóa tìm kiếm không hợp lệ." });
  }
  const search = normalizeBookingSearch(rawSearch);
  const scope = listScope(actor.id, status, month, search);
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, scope);
  } catch {
    return fieldFail(400, { cursor: "Con trỏ trang không hợp lệ." });
  }

  const items: BookingSummary[] = [];
  let shouldContinue = true;
  while (shouldContinue && items.length < limit) {
    const previousPageState = pageState;
    const page = await listStatusBookingRefs(
      status,
      month,
      limit - items.length,
      pageState,
    );
    const rows = await listBookingRowsByIds(
      page.rows.map((row) => row.booking_id),
    );
    const matched = rows.filter(
      (row) => row.status === status && row.month_bucket === month,
    );
    const summaries = await mapBookingSummaries(matched);
    const matching = search
      ? summaries.filter((summary) => matchesBookingSearch(summary, search))
      : summaries;
    items.push(...matching.slice(0, limit - items.length));
    pageState = page.pageState;
    shouldContinue = Boolean(
      search && pageState && pageState !== previousPageState,
    );
  }

  return {
    ok: true,
    data: {
      items,
      nextCursor: encodeCursor(pageState, scope),
    },
  };
}

export async function getDispatchBooking(
  actor: PublicUser,
  bookingId: string,
): Promise<WorkspaceResult<BookingDetail>> {
  if (!isDispatcher(actor)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findBookingRowById(bookingId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng này.");
  const detail = await readBookingDetail(row);
  if (!detail) {
    return fail(400, "Đơn hàng đang ở trạng thái không xác định.");
  }
  return { ok: true, data: detail };
}

function isDispatchAction(value: unknown): value is DispatchAction {
  return value === "assign" || value === "confirm" || value === "cancel";
}

export async function applyDispatchAction(
  actor: PublicUser,
  bookingId: string,
  raw: unknown,
): Promise<WorkspaceResult<BookingSummary>> {
  if (!isDispatcher(actor)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  if (!isRecord(raw) || !isDispatchAction(raw.action)) {
    return fieldFail(400, { action: "Thao tác không hợp lệ." });
  }
  const action = raw.action;
  if (
    !("expectedUpdatedAt" in raw) ||
    (raw.expectedUpdatedAt !== null &&
      typeof raw.expectedUpdatedAt !== "string")
  ) {
    return fieldFail(400, {
      expectedUpdatedAt: "Thiếu phiên bản đơn hàng.",
    });
  }
  const expectedUpdatedAt = raw.expectedUpdatedAt;

  const note =
    typeof raw.note === "string" ? raw.note.trim().replace(/\s+/g, " ") : "";
  if (
    raw.note !== undefined &&
    raw.note !== null &&
    typeof raw.note !== "string"
  ) {
    return fieldFail(400, { note: "Ghi chú không hợp lệ." });
  }
  if (note.length > MAX_CANCEL_NOTE) {
    return fieldFail(400, {
      note: `Ghi chú tối đa ${MAX_CANCEL_NOTE} ký tự.`,
    });
  }
  if (action === "cancel" && note.length === 0) {
    return fieldFail(400, { note: "Vui lòng nhập lý do hủy đơn." });
  }

  const row = await findBookingRowById(bookingId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng này.");
  const current = toBookingStatus(row.status);
  if (!current) {
    return fail(400, "Đơn hàng đang ở trạng thái không xác định.");
  }
  const canonicalUpdatedAt = row.updated_at?.toISOString() ?? null;
  if (expectedUpdatedAt !== canonicalUpdatedAt) {
    return fail(
      409,
      "Đơn vừa được cập nhật. Vui lòng tải lại trước khi thao tác.",
    );
  }

  let targetStatus: MechanicBookingStatus;
  let nextMechanicId = row.mechanic_id;
  let nextMechanicName = row.mechanic_name;

  if (action === "assign") {
    const mechanicId = raw.mechanicId;
    if (!isUuid(mechanicId)) {
      return fieldFail(400, { mechanicId: "Thợ không hợp lệ." });
    }
    if (!ASSIGNABLE_STATUSES.has(current)) {
      return fieldFail(400, {
        action: "Đơn ở trạng thái này không thể phân công.",
      });
    }
    if (row.mechanic_id === mechanicId) {
      return fail(409, "Thợ này đã được phân công cho đơn.");
    }
    if (!(await isMechanicEligible(mechanicId))) {
      return fail(409, "Thợ đã chọn hiện không khả dụng.");
    }
    const conflict = await mechanicScheduleConflict(
      mechanicId,
      row.scheduled_at ?? new Date(),
      bookingId,
    );
    if (conflict !== false) {
      return fail(
        409,
        "Thợ đã chọn có lịch hẹn trùng giờ. Vui lòng chọn thợ khác.",
      );
    }
    const profile = await findMechanicProfileRow(mechanicId);
    targetStatus = "pending";
    nextMechanicId = mechanicId;
    nextMechanicName = profile?.display_name?.trim() || "Thợ FlashWrench";
  } else if (action === "confirm") {
    if (current !== "pending" || row.mechanic_id !== null) {
      return fieldFail(400, {
        action: "Chỉ có thể xác nhận đơn chờ chưa phân công.",
      });
    }
    targetStatus = "confirmed";
  } else {
    if (!ASSIGNABLE_STATUSES.has(current)) {
      return fieldFail(400, {
        action: "Đơn ở trạng thái này không thể hủy.",
      });
    }
    targetStatus = "cancelled";
  }

  const at = nextTransitionAt(row);
  const transition = await transitionBooking({
    before: row,
    status: targetStatus,
    mechanicId: nextMechanicId,
    mechanicName: nextMechanicName,
    actorId: actor.id,
    note: note.length > 0 ? note : null,
    at,
  });
  if (!transition.ok) {
    return { ok: false, status: transition.status, errors: transition.errors };
  }

  if (
    row.mechanic_id &&
    (row.mechanic_id !== nextMechanicId || action === "cancel")
  ) {
    await releaseMechanicIfIdle(row.mechanic_id, bookingId, at);
  }
  await publishBookingChange(
    action === "assign" ? "booking-assigned" : "booking-updated",
    bookingId,
    targetStatus,
    row.customer_id,
    [row.mechanic_id, nextMechanicId],
  );

  // "confirm" releases a verified booking to the system: auto-dispatch
  // offers it to the nearest eligible mechanic right away. Nobody free
  // just means it stays confirmed until the next sweep.
  let finalRow = transition.data;
  if (action === "confirm") {
    try {
      const dispatched = await autoDispatchBooking(bookingId);
      if (dispatched) {
        finalRow = (await findBookingRowById(bookingId)) ?? finalRow;
      }
    } catch {
      // The confirm already persisted; dispatch is best-effort.
    }
  }

  const summaries = await mapBookingSummaries([finalRow]);
  return { ok: true, data: summaries[0] as BookingSummary };
}
