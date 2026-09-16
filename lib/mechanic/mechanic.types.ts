// Shared row/response shapes for the mechanic workspace domain.
// Repositories map raw CQL rows to these rows; services map rows to items.
// Booking status vocabulary follows schema.cql:
// pending | confirmed | mechanic_assigned | en_route | in_progress |
// completed | cancelled | no_show

export type MechanicBookingStatus =
  | "pending"
  | "confirmed"
  | "mechanic_assigned"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

/** Payment state shown on a booking card. */
export type MechanicPaymentState = "paid" | "unpaid" | "refunded";

/** Transaction state of one row in the income history. */
export type MechanicIncomeState = "paid" | "pending" | "refunded";

/** Row shapes straight from ScyllaDB. */
export type MechanicProfileRow = {
  mechanic_id: string;
  display_name: string | null;
  skills: string[] | null;
  base_lat: number | null;
  base_lng: number | null;
  is_verified: boolean | null;
  is_online: boolean | null;
  is_available: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  completed_jobs: number | null;
};

export type MechanicWorkloadRow = {
  mechanic_id: string;
  scheduled_at: Date | null;
  booking_id: string;
  status: string | null;
  total: number | null;
  vehicle_plate: string | null;
  customer_name: string | null;
};

export type MechanicAddressUdt = {
  full_text: string | null;
  lat: number | null;
  lng: number | null;
};

export type MechanicBookingRow = {
  booking_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  mechanic_id: string | null;
  zone_id: string | null;
  address: MechanicAddressUdt | null;
  scheduled_at: Date | null;
  status: string | null;
  payment_status: string | null;
  total: number | null;
  notes: string | null;
  cancel_reason: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type MechanicBookingItemRow = {
  booking_id: string;
  service_id: string;
  service_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
};

export type MechanicStatusHistoryRow = {
  changed_at: Date | null;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  note: string | null;
};

export type MechanicLocationRow = {
  mechanic_id: string;
  lat: number | null;
  lng: number | null;
  current_job_id: string | null;
  current_job_type: string | null;
  updated_at: Date | null;
};

export type MechanicPaymentRow = {
  ref_type: string;
  ref_id: string;
  payment_id: string;
  amount: number | null;
  status: string | null;
  method: string | null;
  paid_at: Date | null;
  created_at: Date | null;
};

export type MechanicReviewRow = {
  target_type: string;
  target_id: string;
  review_id: string;
  customer_name: string | null;
  booking_id: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  created_at: Date | null;
};

/** Items returned by the mechanic API. */
export type MechanicBookingItem = {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type MechanicBookingSummary = {
  id: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  addressText: string;
  addressLat: number | null;
  addressLng: number | null;
  scheduledAt: string | null;
  status: MechanicBookingStatus;
  paymentState: MechanicPaymentState;
  total: number;
  serviceNames: string[];
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MechanicBookingTimelineEntry = {
  at: string | null;
  from: string | null;
  to: MechanicBookingStatus;
  note: string | null;
};

export type MechanicBookingDetail = MechanicBookingSummary & {
  items: MechanicBookingItem[];
  timeline: MechanicBookingTimelineEntry[];
  cancelReason: string;
};

export type MechanicIncomeEntry = {
  bookingId: string;
  customerName: string;
  vehiclePlate: string;
  total: number;
  state: MechanicIncomeState;
  bookingStatus: MechanicBookingStatus;
  method: string;
  stamp: string | null;
};

export type MechanicIncomeSummary = {
  today: number;
  week: number;
  month: number;
  lifetime: number;
  pendingTotal: number;
  paidCount: number;
  pendingCount: number;
};

export type MechanicStats = {
  openJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  noShowJobs: number;
  completedThisMonth: number;
  revenueTotal: number;
  revenueThisMonth: number;
  ratingAvg: number;
  ratingCount: number;
  completionRate: number;
};

export type MechanicMonthlyPoint = {
  month: string;
  completed: number;
  revenue: number;
};

export type MechanicRatingBucket = {
  stars: number;
  count: number;
};

export type MechanicReviewItem = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string | null;
};

export type MechanicNavigationTarget = {
  bookingId: string;
  customerName: string;
  addressText: string;
  lat: number;
  lng: number;
  status: MechanicBookingStatus;
  scheduledAt: string | null;
  distanceKm: number;
  etaMin: number;
  serviceNames: string[];
};

export type MechanicNavigationBoard = {
  origin: { lat: number; lng: number; label: string } | null;
  currentJobId: string | null;
  currentJobType: "booking" | "emergency" | "none";
  targets: MechanicNavigationTarget[];
  locationSavedAt: string | null;
};

export type MechanicSavedLocation = {
  lat: number;
  lng: number;
  currentJobId: string | null;
  currentJobType: "booking" | "emergency" | "none";
  updatedAt: string;
};

export type MechanicFieldErrors = Partial<
  Record<"form" | "action" | "note" | "latitude" | "longitude", string>
>;

export type MechanicResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: MechanicFieldErrors };

/** ISO string for a nullable TIMESTAMP column. */
export function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** Safe number reader: BIGINT/INT columns may arrive as null. */
export function toNumberOr(
  value: number | null | undefined,
  fallback = 0,
): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// DECIMAL columns (mechanics_by_id.rating_avg) arrive as a driver Decimal
// object instead of a number, so read them through String() before parsing.
export function toDecimalOr(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (value === null || value === undefined) return fallback;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}
