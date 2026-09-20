import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { releaseMechanicIfIdle } from "@/lib/mechanic/mechanic-assignment.service";
import {
  findBookingRowById,
  listBookingRowsByIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import {
  mapBookingSummaries,
  readBookingDetail,
} from "./booking-reader.service";
import {
  nextTransitionAt,
  transitionBooking,
} from "./booking-workflow.service";
import { listCustomerBookingRefs } from "./customer-bookings.repository";
import type {
  BookingDetail,
  BookingSummary,
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

function listScope(customerId: string): string {
  return `customer-bookings:${customerId}`;
}

export async function listCustomerBookings(
  customerId: string,
  params: { cursor?: string | null; limit?: unknown } = {},
): Promise<WorkspaceResult<CursorPage<BookingSummary>>> {
  let limit = DEFAULT_PAGE_SIZE;
  if (params.limit !== undefined && params.limit !== null) {
    const parsed = Number(params.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
      return fail(400, "Số lượng không hợp lệ.");
    }
    limit = parsed;
  }
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, listScope(customerId));
  } catch {
    return fail(400, "Con trỏ trang không hợp lệ.");
  }
  const page = await listCustomerBookingRefs(customerId, limit, pageState);
  const rows = await listBookingRowsByIds(
    page.rows.map((row) => row.booking_id),
  );
  const owned = rows.filter(
    (row) =>
      row.customer_id === customerId && toBookingStatus(row.status) !== null,
  );
  return {
    ok: true,
    data: {
      items: await mapBookingSummaries(owned),
      nextCursor: encodeCursor(page.pageState, listScope(customerId)),
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
