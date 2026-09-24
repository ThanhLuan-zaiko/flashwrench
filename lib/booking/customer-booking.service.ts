import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { releaseMechanicIfIdle } from "@/lib/mechanic/mechanic-assignment.service";
import {
  findBookingRowById,
  listBookingRowsByIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import {
  mapBookingSummaries,
  readBookingDetail,
} from "./booking-reader.service";
import {
  MAX_BOOKING_SEARCH_LENGTH,
  matchesBookingSearch,
  normalizeBookingSearch,
} from "./booking-search";
import { listBookingTravelPoints } from "./booking-travel.repository";
import {
  nextTransitionAt,
  transitionBooking,
} from "./booking-workflow.service";
import { listCustomerBookingRefs } from "./customer-bookings.repository";
import type {
  BookingDetail,
  BookingSummary,
  BookingTravelPoint,
  CursorPage,
  WorkspaceResult,
} from "./workspace.types";

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;
const MAX_CANCEL_NOTE = 300;
const CANCELLABLE_STATUSES = new Set([
  "pending",
  "confirmed",
  "mechanic_assigned",
]);

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function listScope(customerId: string, search: string): string {
  return search
    ? `customer-bookings:${customerId}:search:${search}`
    : `customer-bookings:${customerId}`;
}

export async function listCustomerBookings(
  customerId: string,
  params: { cursor?: string | null; limit?: unknown; search?: unknown } = {},
): Promise<WorkspaceResult<CursorPage<BookingSummary>>> {
  let limit = DEFAULT_PAGE_SIZE;
  if (params.limit !== undefined && params.limit !== null) {
    const parsed = Number(params.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
      return fail(400, "Số lượng không hợp lệ.");
    }
    limit = parsed;
  }
  const rawSearch = params.search ?? "";
  if (
    typeof rawSearch !== "string" ||
    rawSearch.length > MAX_BOOKING_SEARCH_LENGTH
  ) {
    return fail(400, "Từ khóa tìm kiếm không hợp lệ.");
  }
  const search = normalizeBookingSearch(rawSearch);
  const scope = listScope(customerId, search);
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, scope);
  } catch {
    return fail(400, "Con trỏ trang không hợp lệ.");
  }

  const items: BookingSummary[] = [];
  let shouldContinue = true;
  while (shouldContinue && items.length < limit) {
    const previousPageState = pageState;
    const page = await listCustomerBookingRefs(
      customerId,
      limit - items.length,
      pageState,
    );
    const rows = await listBookingRowsByIds(
      page.rows.map((row) => row.booking_id),
    );
    const owned = rows.filter(
      (row) =>
        row.customer_id === customerId && toBookingStatus(row.status) !== null,
    );
    const summaries = await mapBookingSummaries(owned);
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

export async function getCustomerBooking(
  customerId: string,
  bookingId: string,
): Promise<WorkspaceResult<BookingDetail>> {
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findBookingRowById(bookingId);
  if (!row || row.customer_id !== customerId) {
    return fail(404, "Không tìm thấy đơn hàng này.");
  }
  const detail = await readBookingDetail(row);
  if (!detail) {
    return fail(400, "Đơn hàng đang ở trạng thái không xác định.");
  }
  return { ok: true, data: detail };
}

export async function getCustomerBookingTrack(
  customerId: string,
  bookingId: string,
): Promise<WorkspaceResult<BookingTravelPoint[]>> {
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const booking = await findBookingRowById(bookingId);
  if (!booking || booking.customer_id !== customerId) {
    return fail(404, "Không tìm thấy đơn hàng này.");
  }
  const rows = await listBookingTravelPoints(bookingId);
  const points: BookingTravelPoint[] = [];
  for (const row of rows) {
    if (
      !row.recorded_at ||
      !isValidLatitude(row.lat) ||
      !isValidLongitude(row.lng)
    ) {
      continue;
    }
    points.push({
      lat: row.lat,
      lng: row.lng,
      recordedAt: row.recorded_at.toISOString(),
    });
  }
  return { ok: true, data: points };
}

export async function cancelCustomerBooking(
  customerId: string,
  bookingId: string,
  noteInput: unknown,
): Promise<WorkspaceResult<BookingSummary>> {
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  if (typeof noteInput !== "string") {
    return fail(400, "Vui lòng nhập lý do hủy đơn.");
  }
  const note = noteInput.trim().replace(/\s+/g, " ");
  if (note.length === 0 || note.length > MAX_CANCEL_NOTE) {
    return fail(400, `Lý do hủy từ 1 đến ${MAX_CANCEL_NOTE} ký tự.`);
  }

  const row = await findBookingRowById(bookingId);
  if (!row || row.customer_id !== customerId) {
    return fail(404, "Không tìm thấy đơn hàng này.");
  }
  const current = toBookingStatus(row.status);
  if (!current) {
    return fail(400, "Đơn hàng đang ở trạng thái không xác định.");
  }
  if (!CANCELLABLE_STATUSES.has(current)) {
    return fail(400, "Đơn hàng ở trạng thái này không thể hủy.");
  }

  const at = nextTransitionAt(row);
  const transition = await transitionBooking({
    before: row,
    status: "cancelled",
    mechanicId: row.mechanic_id,
    mechanicName: row.mechanic_name,
    actorId: customerId,
    note,
    at,
  });
  if (!transition.ok) {
    return { ok: false, status: transition.status, errors: transition.errors };
  }

  if (row.mechanic_id) {
    await releaseMechanicIfIdle(row.mechanic_id, bookingId, at);
  }
  await publishBookingChange(
    "booking-updated",
    bookingId,
    "cancelled",
    customerId,
    [row.mechanic_id],
  );

  const summaries = await mapBookingSummaries([transition.data]);
  return { ok: true, data: summaries[0] as BookingSummary };
}
