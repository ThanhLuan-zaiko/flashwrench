// Shared shapes for the public rescue domain. Guests may file a rescue
// without an account; logged-in customers reuse the same shape and get
// their user id linked. The repository maps these to raw CQL rows.
export type CreateRescueInput = {
  fullName: string;
  phone: string;
  issueType: string;
  description?: string;
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  lat?: number | null;
  lng?: number | null;
};

export type NormalizedRescueInput = {
  fullName: string;
  phone: string;
  issueType: string;
  description: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  address: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
};

export type RescueFieldErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "issueType"
    | "description"
    | "vehiclePlate"
    | "vehicleBrand"
    | "vehicleModel"
    | "address"
    | "province"
    | "district"
    | "ward"
    | "street"
    | "location"
    | "form",
    string
  >
>;

export type CreatedRescue = {
  requestId: string;
  status: string;
  issueType: string;
  priority: string;
  vehiclePlate: string;
  address: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
};

export type RescueResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: RescueFieldErrors };
