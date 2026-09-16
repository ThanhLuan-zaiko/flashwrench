// Shared shapes for the customer booking domain. The repository maps
// these to raw CQL rows; the service maps rows to the created summary.

export type CreateBookingInput = {
  serviceId: string;
  scheduledAt: string;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  notes?: string;
};

export type NormalizedBookingInput = {
  serviceId: string;
  scheduledAt: Date;
  address: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  notes: string | null;
};

export type BookingFieldErrors = Partial<
  Record<
    | "serviceId"
    | "scheduledAt"
    | "address"
    | "province"
    | "district"
    | "ward"
    | "street"
    | "vehiclePlate"
    | "vehicleBrand"
    | "vehicleModel"
    | "notes"
    | "form",
    string
  >
>;

export type CreatedBooking = {
  bookingId: string;
  status: string;
  scheduledAt: string;
  total: number;
  serviceId: string;
  serviceName: string;
  vehiclePlate: string;
  address: string;
};

export type BookingResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: BookingFieldErrors };
