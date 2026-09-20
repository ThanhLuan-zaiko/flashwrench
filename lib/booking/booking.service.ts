// Business logic behind POST /api/bookings: validate the customer
// input, snapshot the catalog price at booking time, then persist one
// atomic batch. Services call repositories, never the ScyllaDB client.

import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import {
  isActiveFlag,
  isDeletedFlag,
} from "@/lib/catalog/service-catalog.types";
import { findCategoryRowById } from "@/lib/catalog/service-categories.repository";
import { findServiceRowById } from "@/lib/catalog/services.repository";
import { DEFAULT_TIME_ZONE } from "@/lib/datetime/timezone";
import {
  isMechanicEligible,
  mechanicScheduleConflict,
} from "@/lib/mechanic/mechanic-assignment.service";
import { monthKey } from "@/lib/mechanic/mechanic-period";
import { findMechanicProfileRow } from "@/lib/mechanic/mechanic-workspace.repository";
import { findVehicleRowById } from "@/lib/vehicles/vehicle.repository";
import { insertCustomerBooking } from "./booking.repository";
import type {
  BookingResult,
  CreateBookingInput,
  CreatedBooking,
} from "./booking.types";
import { validateCreateBookingInput } from "./booking.validation";

export const BOOKING_INITIAL_STATUS = "pending";
export const BOOKING_INITIAL_PAYMENT_STATUS = "unpaid";

function fail<T>(status: number, form: string): BookingResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function createCustomerBooking(
  customer: PublicUser,
  raw: CreateBookingInput,
): Promise<BookingResult<CreatedBooking>> {
  const checked = validateCreateBookingInput(raw);
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  const value = checked.value;

  const service = await findServiceRowById(value.serviceId);
  if (!service || !isActiveFlag(service.is_active, true)) {
    return fail(
      404,
      "Dịch vụ này không còn khả dụng. Vui lòng chọn dịch vụ khác.",
    );
  }
  if (isDeletedFlag(service.is_deleted)) {
    return fail(
      404,
      "Dịch vụ này không còn khả dụng. Vui lòng chọn dịch vụ khác.",
    );
  }
  const category = service.category_id
    ? await findCategoryRowById(service.category_id)
    : null;
  if (
    !category ||
    !isActiveFlag(category.is_active, true) ||
    isDeletedFlag(category.is_deleted)
  ) {
    return fail(
      404,
      "Dịch vụ này không còn khả dụng. Vui lòng chọn dịch vụ khác.",
    );
  }

  const serviceName = service.name ?? "";
  const unitPrice = service.base_price ?? 0;

  let vehicleId: string | null = null;
  let vehiclePlate = value.vehiclePlate;
  let vehicleBrand = value.vehicleBrand;
  let vehicleModel = value.vehicleModel;
  if (value.vehicleId) {
    const vehicle = await findVehicleRowById(value.vehicleId);
    if (!vehicle || vehicle.owner_id !== customer.id) {
      return fail(400, "Xe đã chọn không thuộc tài khoản của bạn.");
    }
    if (vehicle.is_archived === true) {
      return fail(400, "Xe đã chọn đang lưu trữ. Vui lòng chọn xe khác.");
    }
    vehicleId = vehicle.vehicle_id;
    vehiclePlate = vehicle.license_plate ?? value.vehiclePlate;
    vehicleBrand = vehicle.brand ?? value.vehicleBrand;
    vehicleModel = vehicle.model ?? value.vehicleModel;
  }

  // A preselected mechanic is verified against the live profile: the
  // picker may be stale, so a missing or newly-busy mechanic fails here
  // with a clear message instead of writing a dead assignment.
  let mechanicId: string | null = null;
  let mechanicName: string | null = null;
  if (value.mechanicId) {
    if (!(await isMechanicEligible(value.mechanicId))) {
      const profile = await findMechanicProfileRow(value.mechanicId);
      if (!profile) {
        return fail(
          404,
          "Thợ đã chọn không còn khả dụng. Vui lòng chọn thợ khác.",
        );
      }
      return fail(409, "Thợ đã chọn hiện đang bận. Vui lòng chọn thợ khác.");
    }
    const conflict = await mechanicScheduleConflict(
      value.mechanicId,
      value.scheduledAt,
    );
    if (conflict !== false) {
      return fail(
        409,
        "Thợ đã chọn có lịch hẹn trùng giờ. Vui lòng chọn thợ khác.",
      );
    }
    const profile = await findMechanicProfileRow(value.mechanicId);
    mechanicId = value.mechanicId;
    mechanicName = profile?.display_name?.trim() || "Thợ FlashWrench";
  }

  const now = new Date();
  const bookingId = randomUUID();
  // The wall-month bucket follows the zone where the work happens, not
  // UTC: a 00:30 job on Oct 1st in +07 belongs to October dispatchers.
  const timezone = value.timeZone ?? DEFAULT_TIME_ZONE;

  await insertCustomerBooking({
    bookingId,
    customerId: customer.id,
    customerName: customer.fullName,
    customerPhone: customer.phone,
    vehicleId,
    vehiclePlate,
    vehicleBrand,
    vehicleModel,
    address: {
      province: value.province,
      district: value.district,
      ward: value.ward,
      street: value.street,
      full_text: value.address,
      lat: value.lat,
      lng: value.lng,
    },
    scheduledAt: value.scheduledAt,
    timezone,
    status: BOOKING_INITIAL_STATUS,
    paymentStatus: BOOKING_INITIAL_PAYMENT_STATUS,
    subtotal: unitPrice,
    total: unitPrice,
    notes: value.notes,
    monthBucket: monthKey(value.scheduledAt, timezone),
    createdAt: now,
    updatedAt: now,
    serviceId: service.service_id,
    serviceName,
    unitPrice,
    mechanicId,
    mechanicName,
  });

  return {
    ok: true,
    data: {
      bookingId,
      status: BOOKING_INITIAL_STATUS,
      scheduledAt: value.scheduledAt.toISOString(),
      timezone,
      total: unitPrice,
      serviceId: service.service_id,
      serviceName,
      vehiclePlate,
      address: value.address,
      lat: value.lat,
      lng: value.lng,
      mechanicId,
      mechanicName,
    },
  };
}
