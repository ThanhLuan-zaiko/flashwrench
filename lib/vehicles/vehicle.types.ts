export const VEHICLE_TYPES = [
  "car",
  "suv",
  "pickup",
  "van",
  "truck",
  "ev",
  "motorcycle",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export type VehicleInput = {
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  vehicleType: VehicleType;
  odometerKm: number;
};

export type VehicleItem = VehicleInput & {
  id: string;
  archived: boolean;
  createdAt: string;
};

export type VehicleFieldErrors = Partial<
  Record<
    | "licensePlate"
    | "brand"
    | "model"
    | "year"
    | "vehicleType"
    | "odometerKm"
    | "cursor"
    | "form",
    string
  >
>;

export type MaintenanceItem = {
  id: string;
  servicedAt: string | null;
  sourceType: string;
  sourceId: string | null;
  mechanicName: string;
  summary: string;
  cost: number;
  odometerKm: number | null;
  nextDueAt: string | null;
  nextDueKm: number | null;
};
