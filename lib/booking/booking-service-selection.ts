import { buildBookingHref } from "@/lib/auth/auth-redirect";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type { BookingFieldErrors } from "./booking.types";
import {
  BOOKING_DEFAULT_DURATION_MIN,
  BOOKING_MAX_DURATION_MIN,
  BOOKING_MAX_SERVICES,
} from "./booking-services.constants";
import { normalizeBookingServices } from "./booking-services.validation";

export type BookingServiceParams = {
  serviceId?: string | string[];
  serviceIds?: string | string[];
};

export function parseBookingServiceParams(params: BookingServiceParams): {
  serviceIds: string[];
  error: string | null;
} {
  if (params.serviceId === undefined && params.serviceIds === undefined) {
    return { serviceIds: [], error: null };
  }
  if (Array.isArray(params.serviceId)) {
    return {
      serviceIds: [],
      error: "Danh sách dịch vụ không hợp lệ. Vui lòng chọn lại.",
    };
  }
  if (params.serviceIds === undefined && !params.serviceId?.trim()) {
    return { serviceIds: [], error: null };
  }
  const rawIds =
    params.serviceIds === undefined
      ? undefined
      : (Array.isArray(params.serviceIds)
          ? params.serviceIds
          : [params.serviceIds]
        ).flatMap((value) => value.split(","));
  const errors: BookingFieldErrors = {};
  const { serviceIds } = normalizeBookingServices(
    { serviceId: params.serviceId, serviceIds: rawIds },
    errors,
  );
  return { serviceIds, error: errors.serviceIds ?? errors.serviceId ?? null };
}

export function readBookingServiceParams(
  params: Pick<URLSearchParams, "getAll">,
): BookingServiceParams {
  const value = (key: string) => {
    const values = params.getAll(key);
    return values.length > 1 ? values : values[0];
  };
  return { serviceId: value("serviceId"), serviceIds: value("serviceIds") };
}

export function replaceBookingServiceParams(
  path: string,
  serviceIds: readonly string[],
): string {
  const url = new URL(path, "http://localhost");
  const selected = new URL(buildBookingHref(serviceIds), "http://localhost");
  url.searchParams.delete("serviceId");
  url.searchParams.delete("serviceIds");
  for (const [key, value] of selected.searchParams)
    url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function decodeBookingServiceIds(snapshot: string): string[] {
  if (!snapshot) return [];
  try {
    const serviceIds: unknown = JSON.parse(snapshot);
    const errors: BookingFieldErrors = {};
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) return [];
    const normalized = normalizeBookingServices({ serviceIds }, errors);
    return Object.keys(errors).length === 0 ? normalized.serviceIds : [];
  } catch {
    return [];
  }
}

export function getBookingServiceSelection(
  serviceIds: readonly string[],
  catalog: readonly ServiceItem[],
) {
  const available = new Map(
    catalog
      .filter((service) => service.isActive && !service.isDeleted)
      .map((service) => [service.id, service]),
  );
  const services = serviceIds.flatMap((id) => {
    const service = available.get(id);
    return service ? [service] : [];
  });
  const unavailableIds = serviceIds.filter((id) => !available.has(id));
  const subtotal = services.reduce(
    (sum, service) => sum + service.basePrice,
    0,
  );
  const durationMin = services.reduce(
    (sum, service) =>
      sum +
      (service.durationMin > 0
        ? service.durationMin
        : BOOKING_DEFAULT_DURATION_MIN),
    0,
  );
  let issue: string | null = null;
  if (serviceIds.length > BOOKING_MAX_SERVICES) {
    issue = `Một lịch hẹn tối đa ${BOOKING_MAX_SERVICES} dịch vụ.`;
  } else if (unavailableIds.length > 0) {
    issue = "Có dịch vụ không còn khả dụng. Hãy bỏ dịch vụ đó để tiếp tục.";
  } else if (
    serviceIds.length > 1 &&
    services.some((service) => !service.isHomeSupported)
  ) {
    issue =
      "Chỉ các dịch vụ hỗ trợ tại nhà mới có thể đặt chung. Vui lòng đặt riêng dịch vụ còn lại.";
  } else if (durationMin > BOOKING_MAX_DURATION_MIN) {
    issue =
      "Các dịch vụ này cần hơn 48 giờ. Vui lòng tách thành các lịch hẹn riêng.";
  }
  return { services, unavailableIds, subtotal, durationMin, issue };
}
