import type {
  BookingFieldErrors,
  CreateBookingInput,
  NormalizedBookingInput,
} from "./booking.types";

// Booking must leave enough dispatch lead time but cannot be set
// arbitrarily far ahead: the dispatcher bucket is monthly.
export const BOOKING_MIN_LEAD_MINUTES = 60;
export const BOOKING_MAX_AHEAD_DAYS = 30;
export const BOOKING_ADDRESS_MIN = 10;
export const BOOKING_ADDRESS_MAX = 300;
export const BOOKING_NOTES_MAX = 500;
export const BOOKING_PLATE_MIN = 4;
export const BOOKING_PLATE_MAX = 15;
export const BOOKING_PLACE_MAX = 120;
export const BOOKING_VEHICLE_TEXT_MAX = 60;

const PLATE_PATTERN = /^[A-Z0-9][A-Z0-9.\-\s]*[A-Z0-9]$/i;

function optionalText(
  value: unknown,
  max: number,
  message: string,
  errors: BookingFieldErrors,
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

// Pure input validation shared by the /booking form (instant feedback)
// and the POST /api/bookings service (source of truth). Vietnamese
// messages: they are shown directly in the form.
export function validateCreateBookingInput(
  input: CreateBookingInput,
): { value: NormalizedBookingInput } | { errors: BookingFieldErrors } {
  const errors: BookingFieldErrors = {};

  const serviceId =
    typeof input.serviceId === "string" ? input.serviceId.trim() : "";
  if (!serviceId) {
    errors.serviceId = "Vui lòng chọn dịch vụ.";
  }

  let scheduledAt: Date | null = null;
  const rawScheduled =
    typeof input.scheduledAt === "string" ? input.scheduledAt.trim() : "";
  if (!rawScheduled) {
    errors.scheduledAt = "Vui lòng chọn khung giờ.";
  } else {
    const parsed = new Date(rawScheduled);
    if (Number.isNaN(parsed.getTime())) {
      errors.scheduledAt = "Khung giờ không hợp lệ.";
    } else {
      const now = Date.now();
      const earliest = now + BOOKING_MIN_LEAD_MINUTES * 60 * 1000;
      const latest = now + BOOKING_MAX_AHEAD_DAYS * 24 * 60 * 60 * 1000;
      if (parsed.getTime() < earliest) {
        errors.scheduledAt =
          "Vui lòng chọn giờ sau hiện tại ít nhất 1 tiếng để thợ kịp chuẩn bị.";
      } else if (parsed.getTime() > latest) {
        errors.scheduledAt =
          "Chỉ nhận lịch trong vòng 30 ngày tới. Vui lòng chọn giờ gần hơn.";
      } else {
        scheduledAt = parsed;
      }
    }
  }

  const address =
    typeof input.address === "string"
      ? input.address.trim().replace(/\s+/g, " ")
      : "";
  if (!address) {
    errors.address = "Vui lòng nhập địa chỉ sửa xe.";
  } else if (
    address.length < BOOKING_ADDRESS_MIN ||
    address.length > BOOKING_ADDRESS_MAX
  ) {
    errors.address = "Địa chỉ phải dài từ 10 đến 300 ký tự.";
  }

  const plateMessage = "Biển số xe từ 4 đến 15 ký tự (chữ, số, dấu gạch).";
  const vehiclePlate =
    typeof input.vehiclePlate === "string"
      ? input.vehiclePlate.trim().toUpperCase().replace(/\s+/g, " ")
      : "";
  if (!vehiclePlate) {
    errors.vehiclePlate = "Vui lòng nhập biển số xe.";
  } else if (
    vehiclePlate.length < BOOKING_PLATE_MIN ||
    vehiclePlate.length > BOOKING_PLATE_MAX ||
    !PLATE_PATTERN.test(vehiclePlate)
  ) {
    errors.vehiclePlate = plateMessage;
  }

  const province = optionalText(
    input.province,
    BOOKING_PLACE_MAX,
    "Tỉnh/thành tối đa 120 ký tự.",
    errors,
    "province",
  );
  const district = optionalText(
    input.district,
    BOOKING_PLACE_MAX,
    "Quận/huyện tối đa 120 ký tự.",
    errors,
    "district",
  );
  const ward = optionalText(
    input.ward,
    BOOKING_PLACE_MAX,
    "Phường/xã tối đa 120 ký tự.",
    errors,
    "ward",
  );
  const street = optionalText(
    input.street,
    BOOKING_PLACE_MAX,
    "Số nhà/đường tối đa 120 ký tự.",
    errors,
    "street",
  );
  const vehicleBrand = optionalText(
    input.vehicleBrand,
    BOOKING_VEHICLE_TEXT_MAX,
    "Hãng xe tối đa 60 ký tự.",
    errors,
    "vehicleBrand",
  );
  const vehicleModel = optionalText(
    input.vehicleModel,
    BOOKING_VEHICLE_TEXT_MAX,
    "Dòng xe tối đa 60 ký tự.",
    errors,
    "vehicleModel",
  );

  let notes: string | null = null;
  if (
    input.notes !== undefined &&
    input.notes !== null &&
    String(input.notes).trim() !== ""
  ) {
    if (typeof input.notes !== "string") {
      errors.notes = "Ghi chú tối đa 500 ký tự.";
    } else {
      const trimmed = input.notes.trim().replace(/\s+/g, " ");
      if (trimmed.length > BOOKING_NOTES_MAX) {
        errors.notes = "Ghi chú tối đa 500 ký tự.";
      } else {
        notes = trimmed;
      }
    }
  }

  if (Object.keys(errors).length > 0 || !scheduledAt) {
    return { errors };
  }
  return {
    value: {
      serviceId,
      scheduledAt,
      address,
      province,
      district,
      ward,
      street,
      vehiclePlate,
      vehicleBrand,
      vehicleModel,
      notes,
    },
  };
}
