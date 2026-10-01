// Shared shapes for the customer booking domain. The repository maps
// these to raw CQL rows; the service maps rows to the created summary.

export type CreateBookingInput = {
  serviceId: string;
  scheduledAt: string;
  timeZone?: string | null;
  // Guest contact trio: required only when no session exists; signed-in
  // customers keep using their verified account fields instead.
  fullName?: string;
  phone?: string;
  email?: string;
  // Inline signup: a guest can finish account creation in the same submit
  // — the contact trio doubles as the account identity, only the password
  // is new. Ignored when a session already exists.
  createAccount?: boolean;
  password?: string;
  confirmPassword?: string;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  lat?: number | null;
  lng?: number | null;
  mechanicId?: string | null;
  vehicleId?: string | null;
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  notes?: string;
  // Account-bound wallet to spend on this booking. Guests have no
  // wallet, so the service rejects any value without a session.
  walletId?: string;
};

export type NormalizedBookingInput = {
  serviceId: string;
  scheduledAt: Date;
  timeZone: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
  mechanicId: string | null;
  vehicleId: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  notes: string | null;
  walletId: string | null;
};

export type BookingFieldErrors = Partial<
  Record<
    | "serviceId"
    | "scheduledAt"
    | "timeZone"
    | "fullName"
    | "phone"
    | "email"
    | "password"
    | "confirmPassword"
    | "address"
    | "province"
    | "district"
    | "ward"
    | "street"
    | "location"
    | "mechanicId"
    | "vehicleId"
    | "vehiclePlate"
    | "vehicleBrand"
    | "vehicleModel"
    | "notes"
    | "walletId"
    | "form",
    string
  >
>;

export type CreatedBooking = {
  bookingId: string;
  status: string;
  scheduledAt: string;
  timezone: string | null;
  total: number;
  serviceId: string;
  serviceName: string;
  vehiclePlate: string;
  address: string;
  lat: number | null;
  lng: number | null;
  mechanicId: string | null;
  mechanicName: string | null;
};

export type BookingResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: BookingFieldErrors };

// Public guest-tracking payload: the unguessable booking id is the
// capability, so the shape carries journey progress only — status,
// schedule, assigned mechanic, live pin while en route — plus the cash
// confirmation code the guest must read to the mechanic (their only
// channel, since they hold no account session). Never customer PII.
export type PublicBookingTracking = {
  bookingId: string;
  status: string;
  serviceName: string | null;
  scheduledAt: string | null;
  timezone: string | null;
  mechanicName: string | null;
  destination: { lat: number; lng: number } | null;
  location: { lat: number; lng: number; updatedAt: string | null } | null;
  paymentConfirmCode: string | null;
  cancelReason: string | null;
  updatedAt: string | null;
};
