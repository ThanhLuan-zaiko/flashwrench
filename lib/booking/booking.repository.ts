// Raw CQL for customer booking creation. No business logic here: the
// service validates, snapshots the catalog price and computes totals.
import { scylla } from "@/lib/db/client";

export type CustomerBookingAddress = {
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  full_text: string;
  lat: number | null;
  lng: number | null;
};

export type InsertCustomerBookingParams = {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  address: CustomerBookingAddress;
  scheduledAt: Date;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  notes: string | null;
  monthBucket: string;
  createdAt: Date;
  updatedAt: Date;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
};

// One batch keeps every denormalized copy in sync: the booking row, the
// customer history, the dispatcher status bucket, the price snapshot and
// the tracking timeline. No mechanic row yet: dispatch assigns one later.
export async function insertCustomerBooking(
  params: InsertCustomerBookingParams,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO bookings_by_id (booking_id, customer_id, customer_name, customer_phone, vehicle_plate, vehicle_brand, vehicle_model, mechanic_id, mechanic_name, zone_id, address, scheduled_at, status, payment_status, subtotal, travel_fee, discount, total, coupon_code, notes, cancel_reason, month_bucket, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          params.bookingId,
          params.customerId,
          params.customerName,
          params.customerPhone,
          params.vehiclePlate,
          params.vehicleBrand,
          params.vehicleModel,
          null,
          null,
          null,
          params.address,
          params.scheduledAt,
          params.status,
          params.paymentStatus,
          params.subtotal,
          0,
          0,
          params.total,
          null,
          params.notes,
          null,
          params.monthBucket,
          params.createdAt,
          params.updatedAt,
        ],
      },
      {
        query:
          "INSERT INTO bookings_by_customer (customer_id, scheduled_at, booking_id, status, total, vehicle_plate, mechanic_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params: [
          params.customerId,
          params.scheduledAt,
          params.bookingId,
          params.status,
          params.total,
          params.vehiclePlate,
          null,
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
          null,
          null,
          params.total,
        ],
      },
      {
        query:
          "INSERT INTO booking_items (booking_id, service_id, service_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)",
        params: [
          params.bookingId,
          params.serviceId,
          params.serviceName,
          1,
          params.unitPrice,
          params.unitPrice,
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
    ],
    { prepare: true },
  );
}
