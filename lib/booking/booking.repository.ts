// Raw CQL for customer booking creation. No business logic here: the
// service validates, snapshots the catalog price and computes totals.
import { scylla } from "@/lib/db/client";
import type { InsertCustomerBookingParams } from "./booking-write.types";

export type {
  CustomerBookingAddress,
  InsertCustomerBookingParams,
} from "./booking-write.types";

// One batch keeps every denormalized copy in sync: the booking row, the
// customer history, the dispatcher status bucket, the price snapshot and
// the tracking timeline. A preselected mechanic also lands in the
// mechanic workload table so their queue shows the job instantly.
// Guests have no customer partition, so their by_customer row is skipped
// (same split as emergency_by_customer and orders_by_customer).
export async function insertCustomerBooking(
  params: InsertCustomerBookingParams,
): Promise<void> {
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "INSERT INTO bookings_by_id (booking_id, customer_id, customer_name, customer_phone, customer_email, vehicle_id, vehicle_plate, vehicle_brand, vehicle_model, mechanic_id, mechanic_name, zone_id, address, scheduled_at, timezone, duration_min, status, payment_status, subtotal, travel_fee, discount, total, coupon_code, notes, cancel_reason, month_bucket, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.bookingId,
        params.customerId,
        params.customerName,
        params.customerPhone,
        params.customerEmail,
        params.vehicleId,
        params.vehiclePlate,
        params.vehicleBrand,
        params.vehicleModel,
        params.mechanicId,
        params.mechanicName,
        null,
        params.address,
        params.scheduledAt,
        params.timezone,
        params.durationMin,
        params.status,
        params.paymentStatus,
        params.subtotal,
        0,
        params.discount,
        params.total,
        params.couponCode,
        params.notes,
        null,
        params.monthBucket,
        params.createdAt,
        params.updatedAt,
      ],
    },
    {
      query:
        "INSERT INTO bookings_by_status (status, month_bucket, scheduled_at, booking_id, customer_id, mechanic_id, zone_id, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.status,
        params.monthBucket,
        params.scheduledAt,
        params.bookingId,
        params.customerId,
        params.mechanicId,
        null,
        params.total,
      ],
    },
    {
      query:
        "INSERT INTO booking_status_history (booking_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.bookingId,
        params.createdAt,
        null,
        params.status,
        params.customerId,
        null,
      ],
    },
  ];
  queries.push(
    ...params.items.map((item) => ({
      query:
        "INSERT INTO booking_items (booking_id, service_id, service_name, quantity, unit_price, line_total, duration_min, price_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.bookingId,
        item.serviceId,
        item.serviceName,
        item.quantity,
        item.unitPrice,
        item.lineTotal,
        item.durationMin,
        item.priceUnit,
      ],
    })),
  );

  if (params.customerId) {
    queries.push({
      query:
        "INSERT INTO bookings_by_customer (customer_id, scheduled_at, booking_id, status, total, vehicle_plate, mechanic_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.customerId,
        params.scheduledAt,
        params.bookingId,
        params.status,
        params.total,
        params.vehiclePlate,
        params.mechanicName,
      ],
    });
  } else if (params.customerPhone) {
    // Guest bookings leave a contact-keyed lookup row so a later
    // register/login with the same phone+email can absorb them.
    queries.push({
      query:
        "INSERT INTO guest_bookings_by_phone (phone, booking_id, created_at, email) VALUES (?, ?, ?, ?)",
      params: [
        params.customerPhone,
        params.bookingId,
        params.createdAt,
        params.customerEmail,
      ],
    });
    // Second index, keyed by email: the OTP lookup path verifies an address,
    // and the phone partition above cannot answer that question.
    if (params.customerEmail) {
      queries.push({
        query:
          "INSERT INTO guest_records_by_email (email, created_at, record_type, record_id, phone) VALUES (?, ?, 'booking', ?, ?)",
        params: [
          params.customerEmail,
          params.createdAt,
          params.bookingId,
          params.customerPhone,
        ],
      });
    }
  }

  if (params.mechanicId) {
    queries.push({
      query:
        "INSERT INTO bookings_by_mechanic (mechanic_id, scheduled_at, booking_id, status, total, vehicle_plate, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.mechanicId,
        params.scheduledAt,
        params.bookingId,
        params.status,
        params.total,
        params.vehiclePlate,
        params.customerName,
      ],
    });
  }

  await scylla.batch(queries, { prepare: true });
}
