// Raw CQL used only by the mechanic demo seeder (scripts/seed-mechanic.ts).
// Kept apart from the runtime repositories so demo writes never mix with
// the queries the mechanic pages depend on. No business logic here.
import { scylla } from "@/lib/db/client";

type Query = { query: string; params: unknown[] };

export type SeedBookingAddress = {
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  full_text: string;
  lat: number;
  lng: number;
};

export type SeedBookingItem = {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SeedBookingHistoryEntry = {
  at: Date;
  oldStatus: string | null;
  newStatus: string;
  note: string | null;
};

export type SeedBookingParams = {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  mechanicId: string;
  mechanicName: string;
  zoneId: string | null;
  address: SeedBookingAddress;
  scheduledAt: Date;
  status: string;
  paymentStatus: string;
  total: number;
  notes: string | null;
  monthBucket: string;
  createdAt: Date;
  updatedAt: Date;
  items: SeedBookingItem[];
  history: SeedBookingHistoryEntry[];
};

// Writes one booking into every table the mechanic pages read, in a single
// batch so a partially seeded booking can never show up in the UI.
export async function insertBookingWithChildren(
  params: SeedBookingParams,
): Promise<void> {
  const queries: Query[] = [
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
        params.mechanicId,
        params.mechanicName,
        params.zoneId,
        params.address,
        params.scheduledAt,
        params.status,
        params.paymentStatus,
        params.total,
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
        params.zoneId,
        params.total,
      ],
    },
  ];

  for (const item of params.items) {
    queries.push({
      query:
        "INSERT INTO booking_items (booking_id, service_id, service_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.bookingId,
        item.serviceId,
        item.serviceName,
        item.quantity,
        item.unitPrice,
        item.lineTotal,
      ],
    });
  }

  for (const entry of params.history) {
    queries.push({
      query:
        "INSERT INTO booking_status_history (booking_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.bookingId,
        entry.at,
        entry.oldStatus,
        entry.newStatus,
        params.mechanicId,
        entry.note,
      ],
    });
  }

  await scylla.batch(queries, { prepare: true });
}

export type SeedProfileParams = {
  mechanicId: string;
  displayName: string;
  bio: string;
  yearsExperience: number;
  skills: string[];
  baseLat: number;
  baseLng: number;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  completedJobs: number;
  createdAt: Date;
  updatedAt: Date;
};

// rating_avg/rating_count stay untouched: the rating shown in the UI is
// always aggregated from reviews_by_target, never from a cached hint.
export async function upsertMechanicProfileRow(
  params: SeedProfileParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO mechanics_by_id (mechanic_id, display_name, bio, years_experience, skills, zone_ids, base_lat, base_lng, is_verified, is_online, is_available, completed_jobs, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.mechanicId,
      params.displayName,
      params.bio,
      params.yearsExperience,
      params.skills,
      null,
      params.baseLat,
      params.baseLng,
      params.isVerified,
      params.isOnline,
      params.isAvailable,
      params.completedJobs,
      params.createdAt,
      params.updatedAt,
    ],
    { prepare: true },
  );
}

export type SeedPaymentParams = {
  paymentId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: Date;
  createdAt: Date;
};

// payments_by_ref mirrors payments_by_id: both are written so the customer
// payment history and the mechanic income list agree.
export async function insertPaymentRows(
  rows: SeedPaymentParams[],
): Promise<void> {
  if (rows.length === 0) return;
  const queries: Query[] = [];
  for (const row of rows) {
    queries.push(
      {
        query:
          "INSERT INTO payments_by_id (payment_id, ref_type, ref_id, customer_id, amount, method, status, provider_ref, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          row.paymentId,
          "booking",
          row.bookingId,
          row.customerId,
          row.amount,
          row.method,
          row.status,
          null,
          row.paidAt,
          row.createdAt,
        ],
      },
      {
        query:
          "INSERT INTO payments_by_ref (ref_type, ref_id, created_at, payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
        params: [
          "booking",
          row.bookingId,
          row.createdAt,
          row.paymentId,
          row.amount,
          row.status,
        ],
      },
    );
  }
  await scylla.batch(queries, { prepare: true });
}

export type SeedReviewParams = {
  reviewId: string;
  mechanicId: string;
  customerId: string;
  customerName: string;
  bookingId: string;
  rating: number;
  title: string;
  body: string;
  createdAt: Date;
};

export async function insertReviewRows(
  rows: SeedReviewParams[],
): Promise<void> {
  if (rows.length === 0) return;
  const queries: Query[] = [];
  for (const row of rows) {
    queries.push(
      {
        query:
          "INSERT INTO reviews_by_target (target_type, target_id, created_at, review_id, customer_id, customer_name, booking_id, order_id, rating, title, body, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          "mechanic",
          row.mechanicId,
          row.createdAt,
          row.reviewId,
          row.customerId,
          row.customerName,
          row.bookingId,
          null,
          row.rating,
          row.title,
          row.body,
          [],
        ],
      },
      {
        query:
          "INSERT INTO reviews_by_customer (customer_id, created_at, review_id, target_type, target_id, rating) VALUES (?, ?, ?, ?, ?, ?)",
        params: [
          row.customerId,
          row.createdAt,
          row.reviewId,
          "mechanic",
          row.mechanicId,
          row.rating,
        ],
      },
    );
  }
  await scylla.batch(queries, { prepare: true });
}
