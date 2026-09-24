import type { PublicUser } from "@/lib/auth/user.types";
import { listBookingTravelPoints } from "@/lib/booking/booking-travel.repository";
import type {
  BookingTravelPoint,
  WorkspaceResult,
} from "@/lib/booking/workspace.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import { isUuid } from "@/lib/validation";

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function getDispatchBookingTrack(
  actor: PublicUser,
  bookingId: string,
): Promise<WorkspaceResult<BookingTravelPoint[]>> {
  if (actor.role !== "dispatcher" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  if (!(await findBookingRowById(bookingId))) {
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
