import { isUuid } from "@/lib/validation";
import type { BookingFieldErrors, CreateBookingInput } from "./booking.types";
import { BOOKING_MAX_SERVICES } from "./booking-services.constants";

export function normalizeBookingServices(
  input: Pick<
    CreateBookingInput,
    "serviceId" | "serviceIds" | "expectedSubtotal"
  >,
  errors: BookingFieldErrors,
): { serviceIds: string[]; expectedSubtotal: number | null } {
  const multiple = input.serviceIds !== undefined;
  if (input.serviceId !== undefined && typeof input.serviceId !== "string") {
    errors.serviceId = "Dịch vụ đã chọn không hợp lệ. Vui lòng chọn lại.";
  }
  const legacyId =
    typeof input.serviceId === "string"
      ? input.serviceId.trim().toLowerCase()
      : "";
  const field = multiple ? "serviceIds" : "serviceId";
  const raw = multiple ? input.serviceIds : legacyId ? [legacyId] : [];
  let serviceIds: string[] = [];

  if (!Array.isArray(raw) || raw.length === 0) {
    errors[field] = "Vui lòng chọn dịch vụ.";
  } else if (raw.length > BOOKING_MAX_SERVICES) {
    errors[field] = `Một lịch hẹn tối đa ${BOOKING_MAX_SERVICES} dịch vụ.`;
  } else if (raw.some((id) => typeof id !== "string" || !isUuid(id.trim()))) {
    errors[field] = "Dịch vụ đã chọn không hợp lệ. Vui lòng chọn lại.";
  } else {
    serviceIds = raw.map((id) => id.trim().toLowerCase());
    if (new Set(serviceIds).size !== serviceIds.length) {
      errors[field] = "Mỗi dịch vụ chỉ được chọn một lần trong lịch hẹn.";
    } else if (multiple && legacyId && legacyId !== serviceIds[0]) {
      errors[field] = "Danh sách dịch vụ không khớp. Vui lòng chọn lại.";
    }
  }

  let expectedSubtotal: number | null = null;
  if (input.expectedSubtotal !== undefined) {
    if (
      !Number.isSafeInteger(input.expectedSubtotal) ||
      input.expectedSubtotal < 0
    ) {
      errors.form = "Giá tạm tính không hợp lệ. Vui lòng tải lại bảng giá.";
    } else {
      expectedSubtotal = input.expectedSubtotal;
    }
  }
  return { serviceIds, expectedSubtotal };
}
