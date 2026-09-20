import { isRecord, numericInput } from "@/lib/validation";
import type {
  VehicleFieldErrors,
  VehicleInput,
  VehicleType,
} from "./vehicle.types";
import { VEHICLE_TYPES } from "./vehicle.types";

export const VEHICLE_PLATE_MIN = 4;
export const VEHICLE_PLATE_MAX = 15;
export const VEHICLE_TEXT_MAX = 60;
export const VEHICLE_YEAR_MIN = 1900;
export const VEHICLE_ODOMETER_MAX = 2_000_000;

const PLATE_PATTERN = /^[A-Z0-9][A-Z0-9.\-\s]*[A-Z0-9]$/i;

function textField(
  value: unknown,
  field: "brand" | "model",
  errors: VehicleFieldErrors,
): string {
  if (typeof value !== "string") {
    errors[field] = "Thông tin xe không hợp lệ.";
    return "";
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0 || trimmed.length > VEHICLE_TEXT_MAX) {
    errors[field] = "Thông tin xe không hợp lệ.";
    return "";
  }
  return trimmed;
}

export function canonicalPlate(plate: string): string {
  return plate.replace(/[.\-\s]/g, "").toUpperCase();
}

export function validateVehicleInput(
  input: unknown,
): { value: VehicleInput } | { errors: VehicleFieldErrors } {
  const errors: VehicleFieldErrors = {};
  if (!isRecord(input)) {
    return { errors: { form: "Dữ liệu gửi lên không hợp lệ." } };
  }
  const raw = input;

  const formattedPlate =
    typeof raw.licensePlate === "string"
      ? raw.licensePlate.trim().toUpperCase().replace(/\s+/g, " ")
      : "";
  let licensePlate = "";
  const normalizedPlate = canonicalPlate(formattedPlate);
  if (
    normalizedPlate.length < VEHICLE_PLATE_MIN ||
    normalizedPlate.length > VEHICLE_PLATE_MAX ||
    !PLATE_PATTERN.test(formattedPlate)
  ) {
    errors.licensePlate = "Biển số xe không hợp lệ.";
  } else {
    licensePlate = normalizedPlate;
  }

  const brand = textField(raw.brand, "brand", errors);
  const model = textField(raw.model, "model", errors);

  let year: number | null = null;
  if (raw.year !== undefined && raw.year !== null && raw.year !== "") {
    const parsed = numericInput(raw.year);
    const maxYear = new Date().getFullYear() + 1;
    if (
      !Number.isInteger(parsed) ||
      parsed < VEHICLE_YEAR_MIN ||
      parsed > maxYear
    ) {
      errors.year = "Năm sản xuất không hợp lệ.";
    } else {
      year = parsed;
    }
  }

  const vehicleType =
    typeof raw.vehicleType === "string" &&
    VEHICLE_TYPES.includes(raw.vehicleType as VehicleType)
      ? (raw.vehicleType as VehicleType)
      : null;
  if (!vehicleType) {
    errors.vehicleType = "Loại xe không hợp lệ.";
  }

  const odometer = numericInput(raw.odometerKm);
  if (
    !Number.isInteger(odometer) ||
    odometer < 0 ||
    odometer > VEHICLE_ODOMETER_MAX
  ) {
    errors.odometerKm = "Số km đã đi không hợp lệ.";
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    value: {
      licensePlate,
      brand,
      model,
      year,
      vehicleType: vehicleType as VehicleType,
      odometerKm: odometer,
    },
  };
}
