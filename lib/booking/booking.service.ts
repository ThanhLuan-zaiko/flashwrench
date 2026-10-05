// Business logic behind POST /api/bookings: validate the customer
// input, snapshot the catalog price at booking time, then persist one
// atomic batch. Services call repositories, never the ScyllaDB client.

import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { DEFAULT_TIME_ZONE } from "@/lib/datetime/timezone";
import { autoDispatchBooking } from "@/lib/dispatch/auto-dispatch.service";
import {
  isMechanicEligible,
  mechanicScheduleConflict,
} from "@/lib/mechanic/mechanic-assignment.service";
import { monthKey } from "@/lib/mechanic/mechanic-period";
import { findMechanicProfileRow } from "@/lib/mechanic/mechanic-workspace.repository";
import {
  getBusinessHoursPolicy,
  openWindowOf,
} from "@/lib/shop/business-hours.service";
import { findVehicleRowById } from "@/lib/vehicles/vehicle.repository";
import { publishWalletChange } from "@/lib/vouchers/voucher-realtime";
import {
  redeemWallet,
  releaseWalletReservation,
} from "@/lib/vouchers/voucher-spend.service";
import { insertCustomerBooking } from "./booking.repository";
import type {
  BookingResult,
  CreateBookingInput,
  CreatedBooking,
} from "./booking.types";
import { validateCreateBookingInput } from "./booking.validation";
import { resolveBookingServices } from "./booking-catalog.service";
import { getBookingPolicy } from "./booking-config.service";

export const BOOKING_INITIAL_STATUS = "pending";
export const BOOKING_INITIAL_PAYMENT_STATUS = "unpaid";

function fail<T>(status: number, form: string): BookingResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function createCustomerBooking(
  customer: PublicUser | null,
  raw: CreateBookingInput,
): Promise<BookingResult<CreatedBooking>> {
  const guest = customer === null;
  const policy = await getBookingPolicy();
  // Guest intake is an admin knob: when it flips off, unauthenticated
  // submits stop here before any account or booking write.
  if (guest && !policy.guestBookingEnabled) {
    return fail(
      403,
      "Cửa hàng hiện chỉ nhận đặt lịch sau khi đăng nhập. Vui lòng đăng nhập rồi đặt lại.",
    );
  }
  const hours = await getBusinessHoursPolicy();
  const checked = validateCreateBookingInput(raw, {
    guest,
    minLeadDays: policy.minLeadDays,
    maxAdvanceDays: policy.maxAdvanceDays,
    openWindow: openWindowOf(hours),
  });
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  const value = checked.value;

  const catalog = await resolveBookingServices(value.serviceIds);
  if (!catalog.ok) return catalog;
  const { items, subtotal, durationMin } = catalog.data;
  const serviceName = items.map((item) => item.serviceName).join(", ");
  if (value.expectedSubtotal !== null && value.expectedSubtotal !== subtotal) {
    return fail(
      409,
      "Bảng giá vừa thay đổi. Vui lòng kiểm tra giá mới rồi xác nhận lại.",
    );
  }

  let vehicleId: string | null = null;
  let vehiclePlate = value.vehiclePlate;
  let vehicleBrand = value.vehicleBrand;
  let vehicleModel = value.vehicleModel;
  // Saved vehicles belong to an account; guests always describe their
  // vehicle through the plate/brand/model text fields instead.
  if (value.vehicleId && customer) {
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
      undefined,
      durationMin,
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
  // Account-bound wallets spend here: guests are rejected before any
  // write so the incentive copy stays accurate. The wallet id lands in
  // coupon_code, so cancels can return it to the owner later.
  if (guest && value.walletId) {
    return fail(
      400,
      "Khách vãng lai chưa dùng được voucher. Hãy tạo tài khoản để nhận ưu đãi.",
    );
  }
  let discount = 0;
  const walletId = !guest && customer ? (value.walletId ?? null) : null;
  if (walletId && customer) {
    const redeemed = await redeemWallet({
      walletId,
      userId: customer.id,
      subtotal,
      kind: "booking",
      bookingId,
    });
    if (!redeemed.ok) {
      return {
        ok: false,
        status: redeemed.status,
        errors: { walletId: redeemed.errors.form ?? "Không áp được voucher." },
      };
    }
    discount = redeemed.data.discount;
  }
  // The wall-month bucket follows the zone where the work happens, not
  // UTC: a 00:30 job on Oct 1st in +07 belongs to October dispatchers.
  const timezone = value.timeZone ?? DEFAULT_TIME_ZONE;

  try {
    await insertCustomerBooking({
      bookingId,
      customerId: customer?.id ?? null,
      customerName: customer?.fullName ?? value.fullName ?? "",
      customerPhone: customer?.phone ?? value.phone ?? "",
      customerEmail: customer?.email || value.email,
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
      subtotal,
      discount,
      couponCode: walletId,
      total: subtotal - discount,
      notes: value.notes,
      monthBucket: monthKey(value.scheduledAt, timezone),
      createdAt: now,
      updatedAt: now,
      items,
      durationMin,
      mechanicId,
      mechanicName,
    });
  } catch (error) {
    if (walletId) await releaseWalletReservation(walletId, { bookingId });
    throw error;
  }
  if (walletId && customer) {
    void publishWalletChange({
      kind: "voucher-used",
      walletId,
      userId: customer.id,
    });
  }

  // Member-vs-guest counters: best-effort, never blocks the booking.
  // Lazy import keeps this module out of the client bundle graph.
  void import("@/lib/customer-mix/customer-mix.service")
    .then(({ recordMixEvent }) =>
      recordMixEvent("booking", guest ? "guest" : "member", {
        at: now,
        actor: customer ? customer.id : (value.email ?? undefined),
      }),
    )
    .catch(() => undefined);

  // No mechanic picked: auto-dispatch runs the dispatcher's "assign"
  // step immediately so the nearest eligible mechanic gets the offer.
  // A dispatch failure must never fail a booking that already
  // persisted — it just stays on the pending queue for a human.
  if (mechanicId === null) {
    try {
      const dispatched = await autoDispatchBooking(bookingId);
      if (dispatched) {
        mechanicId = dispatched.mechanicId;
        mechanicName = dispatched.mechanicName;
      }
    } catch {
      // Left unassigned for the dispatcher queue.
    }
  }

  return {
    ok: true,
    data: {
      bookingId,
      status: BOOKING_INITIAL_STATUS,
      scheduledAt: value.scheduledAt.toISOString(),
      timezone,
      total: subtotal - discount,
      subtotal,
      discount,
      travelFee: 0,
      serviceId: value.serviceId,
      serviceIds: value.serviceIds,
      serviceName,
      items,
      durationMin,
      vehiclePlate,
      address: value.address,
      lat: value.lat,
      lng: value.lng,
      mechanicId,
      mechanicName,
    },
  };
}
