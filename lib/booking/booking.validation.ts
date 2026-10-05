import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validatePassword,
  validatePhone,
} from "@/lib/auth/validation";
import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import { isUuid } from "@/lib/validation";
import type {
  BookingFieldErrors,
  CreateBookingInput,
  NormalizedBookingInput,
} from "./booking.types";
import {
  BOOKING_MIN_LEAD_DAYS,
  normalizeScheduledAt,
  type ScheduleWindowOptions,
} from "./booking-schedule.validation";
import { normalizeBookingServices } from "./booking-services.validation";
import { normalizeBookingTimeZone } from "./booking-timezone.validation";
import { normalizeWalletId } from "./booking-wallet.validation";

// The slot is a customer wish — staff confirm the real time later — so
// the only bound is the intake window in booking-schedule.validation.
// The 2-day floor is the code default; admins retune it via
// booking_config and the value reaches this validator through options.
export { BOOKING_MIN_LEAD_DAYS };
export const BOOKING_NAME_MAX = 100;
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
  options?: { guest?: boolean } & ScheduleWindowOptions,
): { value: NormalizedBookingInput } | { errors: BookingFieldErrors } {
  const errors: BookingFieldErrors = {};

  // Guests file without an account: the contact trio is their only
  // reach-back channel, so all three are required and validated here.
  let fullName: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;
  if (options?.guest) {
    fullName =
      typeof input.fullName === "string"
        ? input.fullName.trim().replace(/\s+/g, " ")
        : "";
    if (!fullName) {
      errors.fullName = "Vui lòng nhập họ và tên.";
    } else if (fullName.length < 2) {
      errors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    } else if (fullName.length > BOOKING_NAME_MAX) {
      errors.fullName = "Họ và tên không được quá 100 ký tự.";
    }
    const phoneError = validatePhone(
      typeof input.phone === "string" ? input.phone : "",
    );
    if (phoneError) {
      errors.phone = phoneError;
    } else {
      phone = normalizePhone(input.phone ?? "");
    }
    const emailError = validateEmail(
      typeof input.email === "string" ? input.email : "",
    );
    if (emailError) {
      errors.email = emailError;
    } else {
      email = normalizeEmail(input.email ?? "");
    }

    // Inline signup: opting in asks for just the password pair — the
    // contact trio doubles as the account identity. The register service
    // re-checks everything; this pass exists so the form shows the
    // booking-style field errors in one go.
    if (input.createAccount === true) {
      const password = typeof input.password === "string" ? input.password : "";
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
      const confirm =
        typeof input.confirmPassword === "string" ? input.confirmPassword : "";
      if (!confirm) {
        errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
      } else if (confirm !== password) {
        errors.confirmPassword = "Mật khẩu nhập lại không khớp.";
      }
    }
  }

  const { serviceIds, expectedSubtotal } = normalizeBookingServices(
    input,
    errors,
  );
  const serviceId = serviceIds[0] ?? "";

  const scheduledAt = normalizeScheduledAt(
    input.scheduledAt,
    options ?? {},
    errors,
  );

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

  // Map coordinates travel together: the picker sets both, manual typing
  // sets neither. One without the other is a client bug, reject loudly.
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

  let normalizedMechanicId: string | null = null;
  if (input.mechanicId !== undefined && input.mechanicId !== null) {
    if (typeof input.mechanicId !== "string") {
      errors.mechanicId = "Thợ đã chọn không hợp lệ.";
    } else {
      const mechanicId = input.mechanicId.trim();
      if (mechanicId.length > 0) {
        if (!isUuid(mechanicId)) {
          errors.mechanicId = "Thợ đã chọn không hợp lệ.";
        } else {
          normalizedMechanicId = mechanicId;
        }
      }
    }
  }

  let normalizedVehicleId: string | null = null;
  if (input.vehicleId !== undefined && input.vehicleId !== null) {
    if (typeof input.vehicleId !== "string") {
      errors.vehicleId = "Xe đã chọn không hợp lệ.";
    } else {
      const vehicleId = input.vehicleId.trim();
      if (vehicleId.length > 0) {
        if (!isUuid(vehicleId)) {
          errors.vehicleId = "Xe đã chọn không hợp lệ.";
        } else {
          normalizedVehicleId = vehicleId;
        }
      }
    }
  }

  // Account-bound wallets travel as the wallet id; the shared helper
  // rejects guests with the signup incentive and garbage with 400.
  const walletId = normalizeWalletId(
    input.walletId,
    options?.guest ?? false,
    errors,
  );

  // The zone travels separately so a typo can never silently
  // reschedule a booking.
  const timeZone = normalizeBookingTimeZone(input.timeZone, errors);

  if (Object.keys(errors).length > 0 || !scheduledAt) {
    return { errors };
  }
  return {
    value: {
      serviceId,
      serviceIds,
      expectedSubtotal,
      scheduledAt,
      timeZone,
      fullName,
      phone,
      email,
      address,
      province,
      district,
      ward,
      street,
      lat,
      lng,
      mechanicId: normalizedMechanicId,
      vehicleId: normalizedVehicleId,
      vehiclePlate,
      vehicleBrand,
      vehicleModel,
      notes,
      walletId,
    },
  };
}
