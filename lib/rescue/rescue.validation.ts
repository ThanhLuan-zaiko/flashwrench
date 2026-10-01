import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validatePhone,
} from "@/lib/auth/validation";
import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import type {
  CreateRescueInput,
  NormalizedRescueInput,
  RescueFieldErrors,
} from "./rescue.types";

export const RESCUE_ISSUE_TYPES = [
  "flat_tire",
  "dead_battery",
  "engine_failure",
  "accident",
  "out_of_fuel",
  "overheating",
  "locked_out",
  "other",
] as const;

export type RescueIssueType = (typeof RESCUE_ISSUE_TYPES)[number];

export const RESCUE_ADDRESS_MIN = 10;
export const RESCUE_ADDRESS_MAX = 300;
export const RESCUE_DESCRIPTION_MAX = 1000;
export const RESCUE_NAME_MAX = 100;
export const RESCUE_PLACE_MAX = 120;
export const RESCUE_VEHICLE_TEXT_MAX = 60;
export const RESCUE_PLATE_MIN = 4;
export const RESCUE_PLATE_MAX = 15;

const PLATE_PATTERN = /^[A-Z0-9][A-Z0-9.\-\s]*[A-Z0-9]$/i;

function optionalText(
  value: unknown,
  max: number,
  message: string,
  errors: RescueFieldErrors,
  field:
    | "province"
    | "district"
    | "ward"
    | "street"
    | "vehicleBrand"
    | "vehicleModel",
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    errors[field] = message;
    return null;
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (trimmed.length > max) {
    errors[field] = message;
    return null;
  }
  return trimmed;
}

// Pure input validation shared by the /rescue form and POST /api/rescue.
// Vietnamese messages: they render directly in the form.
export function validateCreateRescueInput(
  input: CreateRescueInput,
): { value: NormalizedRescueInput } | { errors: RescueFieldErrors } {
  const errors: RescueFieldErrors = {};

  const fullName =
    typeof input.fullName === "string"
      ? input.fullName.trim().replace(/\s+/g, " ")
      : "";
  if (!fullName) {
    errors.fullName = "Vui lòng nhập họ và tên.";
  } else if (fullName.length < 2) {
    errors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
  } else if (fullName.length > RESCUE_NAME_MAX) {
    errors.fullName = "Họ và tên không được quá 100 ký tự.";
  }

  const rawPhone = typeof input.phone === "string" ? input.phone : "";
  const phoneError = validatePhone(rawPhone);
  if (phoneError) {
    errors.phone = phoneError;
  }
  const phone = normalizePhone(rawPhone);

  // Required for every caller: this is the address the OTP lookup verifies, so
  // a rescue filed without one could never be found again.
  const emailError = validateEmail(
    typeof input.email === "string" ? input.email : "",
  );
  if (emailError) {
    errors.email = emailError;
  }
  const email = normalizeEmail(
    typeof input.email === "string" ? input.email : "",
  );

  const issueType =
    typeof input.issueType === "string" ? input.issueType.trim() : "";
  if (!issueType) {
    errors.issueType = "Vui lòng chọn sự cố đang gặp.";
  } else if (!(RESCUE_ISSUE_TYPES as readonly string[]).includes(issueType)) {
    errors.issueType = "Sự cố đã chọn không hợp lệ.";
  }

  let description: string | null = null;
  if (
    input.description !== undefined &&
    input.description !== null &&
    String(input.description).trim() !== ""
  ) {
    if (typeof input.description !== "string") {
      errors.description = "Mô tả tối đa 1000 ký tự.";
    } else {
      const trimmed = input.description.trim().replace(/\s+/g, " ");
      if (trimmed.length > RESCUE_DESCRIPTION_MAX) {
        errors.description = "Mô tả tối đa 1000 ký tự.";
      } else {
        description = trimmed;
      }
    }
  }

  const address =
    typeof input.address === "string"
      ? input.address.trim().replace(/\s+/g, " ")
      : "";
  if (!address) {
    errors.address = "Vui lòng nhập địa chỉ nơi xe đang dừng.";
  } else if (
    address.length < RESCUE_ADDRESS_MIN ||
    address.length > RESCUE_ADDRESS_MAX
  ) {
    errors.address = "Địa chỉ phải dài từ 10 đến 300 ký tự.";
  }

  const vehiclePlate =
    typeof input.vehiclePlate === "string"
      ? input.vehiclePlate.trim().toUpperCase().replace(/\s+/g, " ")
      : "";
  if (!vehiclePlate) {
    errors.vehiclePlate = "Vui lòng nhập biển số xe.";
  } else if (
    vehiclePlate.length < RESCUE_PLATE_MIN ||
    vehiclePlate.length > RESCUE_PLATE_MAX ||
    !PLATE_PATTERN.test(vehiclePlate)
  ) {
    errors.vehiclePlate = "Biển số xe từ 4 đến 15 ký tự (chữ, số, dấu gạch).";
  }

  const province = optionalText(
    input.province,
    RESCUE_PLACE_MAX,
    "Tỉnh/thành tối đa 120 ký tự.",
    errors,
    "province",
  );
  const district = optionalText(
    input.district,
    RESCUE_PLACE_MAX,
    "Quận/huyện tối đa 120 ký tự.",
    errors,
    "district",
  );
  const ward = optionalText(
    input.ward,
    RESCUE_PLACE_MAX,
    "Phường/xã tối đa 120 ký tự.",
    errors,
    "ward",
  );
  const street = optionalText(
    input.street,
    RESCUE_PLACE_MAX,
    "Số nhà/đường tối đa 120 ký tự.",
    errors,
    "street",
  );
  const vehicleBrand = optionalText(
    input.vehicleBrand,
    RESCUE_VEHICLE_TEXT_MAX,
    "Hãng xe tối đa 60 ký tự.",
    errors,
    "vehicleBrand",
  );
  const vehicleModel = optionalText(
    input.vehicleModel,
    RESCUE_VEHICLE_TEXT_MAX,
    "Dòng xe tối đa 60 ký tự.",
    errors,
    "vehicleModel",
  );

  const latProvided = input.lat !== undefined && input.lat !== null;
  const lngProvided = input.lng !== undefined && input.lng !== null;
  let lat: number | null = null;
  let lng: number | null = null;
  if (!latProvided && !lngProvided) {
    lat = null;
    lng = null;
  } else if (
    latProvided &&
    lngProvided &&
    isValidLatitude(input.lat) &&
    isValidLongitude(input.lng)
  ) {
    lat = input.lat;
    lng = input.lng;
  } else {
    errors.location = "Vị trí trên bản đồ không hợp lệ. Vui lòng chọn lại.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  return {
    value: {
      fullName,
      phone,
      email,
      issueType,
      description,
      vehiclePlate,
      vehicleBrand,
      vehicleModel,
      address,
      province,
      district,
      ward,
      street,
      lat,
      lng,
    },
  };
}
