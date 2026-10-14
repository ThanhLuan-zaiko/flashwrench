import { insertBookingTravelPoint } from "@/lib/booking/booking-travel.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import type { OrderRow } from "@/lib/orders/orders.types";
import { insertOrderTravelPoint } from "@/lib/orders/orders-delivery.repository";
import {
  publishBookingChange,
  publishOrderChange,
} from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import type {
  MechanicBookingRow,
  MechanicFieldErrors,
  MechanicNavigationBoard,
  MechanicResult,
  MechanicSavedLocation,
} from "./mechanic.types";
import { findBookingRowById } from "./mechanic-bookings.repository";
import { isValidLatitude, isValidLongitude } from "./mechanic-geo";
import { toBookingStatus } from "./mechanic-mapper";
import { upsertMechanicLocation } from "./mechanic-workspace.repository";

type NavigationCurrentType = MechanicNavigationBoard["currentJobType"];

function fieldError<T>(
  status: number,
  errors: MechanicFieldErrors,
): MechanicResult<T> {
  return { ok: false, status, errors };
}

export type SaveMechanicLocationInput = {
  latitude: unknown;
  longitude: unknown;
  currentJobId?: unknown;
  currentJobType?: unknown;
};

function readJobType(value: unknown): NavigationCurrentType | null {
  if (value === undefined || value === null || value === "none") {
    return "none";
  }
  if (value === "booking") return "booking";
  if (value === "order") return "order";
  return null;
}

// The app marks itself busy on the map the same time it shares GPS: the
// saved row is timestamped so the board can show how fresh the position is.
export async function saveMechanicLocation(
  mechanicId: string,
  input: SaveMechanicLocationInput,
): Promise<MechanicResult<MechanicSavedLocation>> {
  const { latitude, longitude, currentJobId, currentJobType } = input;
  const errors: MechanicFieldErrors = {};
  if (!isValidLatitude(latitude)) {
    errors.latitude = "Vĩ độ không hợp lệ (từ -90 đến 90).";
  }
  if (!isValidLongitude(longitude)) {
    errors.longitude = "Kinh độ không hợp lệ (từ -180 đến 180).";
  }
  const jobType = readJobType(currentJobType);
  if (jobType === null) {
    errors.action = "Loại công việc không hợp lệ.";
  }
  const jobId =
    typeof currentJobId === "string" && currentJobId.length > 0
      ? currentJobId
      : null;
  if ((jobType === "booking" || jobType === "order") && !isUuid(jobId)) {
    errors.action = "Mã công việc không hợp lệ.";
  }
  if (jobType === "none" && jobId) {
    errors.action = "Công việc trống không được kèm mã đơn.";
  }
  if (Object.keys(errors).length > 0) return fieldError(400, errors);

  let linkedBooking: MechanicBookingRow | null = null;
  if (jobType === "booking" && jobId) {
    linkedBooking = await findBookingRowById(jobId);
    if (!linkedBooking || linkedBooking.mechanic_id !== mechanicId) {
      return fieldError(404, { form: "Không tìm thấy đơn hàng này." });
    }
    const status = toBookingStatus(linkedBooking.status);
    if (status !== "en_route" && status !== "in_progress") {
      return fieldError(400, {
        action: "Chỉ ghim vị trí khi đơn đang di chuyển hoặc đang sửa.",
      });
    }
  }
  let linkedOrder: OrderRow | null = null;
  if (jobType === "order" && jobId) {
    linkedOrder = await findOrderRowById(jobId);
    if (
      linkedOrder?.courier_type !== "mechanic" ||
      linkedOrder.courier_id !== mechanicId
    ) {
      return fieldError(404, { form: "Không tìm thấy đơn giao hàng này." });
    }
    if (linkedOrder.status !== "shipping") {
      return fieldError(400, {
        action: "Chỉ ghim vị trí khi đơn đang được giao.",
      });
    }
  }

  const savedAt = new Date();
  const savedJobType =
    jobType === "booking" || jobType === "order" ? jobType : "none";
  await upsertMechanicLocation({
    mechanicId,
    lat: latitude as number,
    lng: longitude as number,
    currentJobId: savedJobType === "none" ? null : jobId,
    currentJobType: savedJobType,
    updatedAt: savedAt,
  });
  if (linkedBooking && toBookingStatus(linkedBooking.status) === "en_route") {
    await insertBookingTravelPoint({
      bookingId: linkedBooking.booking_id,
      mechanicId,
      lat: latitude as number,
      lng: longitude as number,
      recordedAt: savedAt,
    });
  }
  if (linkedOrder) {
    await insertOrderTravelPoint({
      orderId: linkedOrder.order_id,
      courierId: mechanicId,
      lat: latitude as number,
      lng: longitude as number,
      recordedAt: savedAt,
    });
    // Courier pins on customer /track/order maps read the live mechanic
    // location row: fan out so they move instantly instead of 15s poll.
    await publishOrderChange(
      linkedOrder.order_id,
      linkedOrder.status ?? "shipping",
      linkedOrder.customer_id,
    ).catch(() => undefined);
  }
  // Travel points and live pins share the same GPS save: en_route moves
  // must fan out too (previously only non-en_route published, leaving all
  // tracking maps poll-only while the mechanic was moving).
  if (linkedBooking) {
    await publishBookingChange(
      "booking-updated",
      linkedBooking.booking_id,
      linkedBooking.status ?? "",
      linkedBooking.customer_id,
      [mechanicId],
    ).catch(() => undefined);
  }
  return {
    ok: true,
    data: {
      lat: latitude as number,
      lng: longitude as number,
      currentJobId: savedJobType === "none" ? null : jobId,
      currentJobType: savedJobType,
      updatedAt: savedAt.toISOString(),
    },
  };
}
