import {
  isActiveFlag,
  isDeletedFlag,
} from "@/lib/catalog/service-catalog.types";
import { findCategoryRowById } from "@/lib/catalog/service-categories.repository";
import { findServiceRowById } from "@/lib/catalog/services.repository";
import type { BookingResult, BookingServiceSnapshot } from "./booking.types";
import {
  BOOKING_DEFAULT_DURATION_MIN,
  BOOKING_MAX_DURATION_MIN,
} from "./booking-services.constants";

type BookingCatalog = {
  items: BookingServiceSnapshot[];
  subtotal: number;
  durationMin: number;
};

function unavailable(): BookingResult<BookingCatalog> {
  return {
    ok: false,
    status: 404,
    errors: {
      form: "Có dịch vụ không còn khả dụng. Vui lòng kiểm tra lại danh sách đã chọn.",
    },
  };
}

export async function resolveBookingServices(
  serviceIds: string[],
): Promise<BookingResult<BookingCatalog>> {
  const rows = await Promise.all(serviceIds.map(findServiceRowById));
  if (
    rows.some(
      (row) =>
        !row ||
        !isActiveFlag(row.is_active, true) ||
        isDeletedFlag(row.is_deleted),
    )
  ) {
    return unavailable();
  }
  const services = rows.filter((row) => row !== null);
  const categoryIds = [...new Set(services.map((row) => row.category_id))];
  const categories = await Promise.all(
    categoryIds.map((id) => (id ? findCategoryRowById(id) : null)),
  );
  if (
    categories.some(
      (row) =>
        !row ||
        !isActiveFlag(row.is_active, true) ||
        isDeletedFlag(row.is_deleted),
    )
  ) {
    return unavailable();
  }
  if (
    services.length > 1 &&
    services.some((row) => row.is_home_supported === false)
  ) {
    return {
      ok: false,
      status: 400,
      errors: {
        serviceIds:
          "Chỉ các dịch vụ hỗ trợ tại nhà mới có thể đặt chung. Vui lòng đặt riêng dịch vụ còn lại.",
      },
    };
  }

  const items: BookingServiceSnapshot[] = services.map((service) => ({
    serviceId: service.service_id,
    serviceName: service.name ?? "Dịch vụ sửa xe",
    quantity: 1,
    unitPrice: service.base_price ?? 0,
    lineTotal: service.base_price ?? 0,
    priceUnit:
      service.price_unit === "per_hour" || service.price_unit === "per_item"
        ? service.price_unit
        : "per_job",
    durationMin:
      service.duration_min && service.duration_min > 0
        ? service.duration_min
        : BOOKING_DEFAULT_DURATION_MIN,
  }));
  if (
    items.some(
      (item) =>
        !Number.isSafeInteger(item.unitPrice) ||
        item.unitPrice < 0 ||
        !Number.isSafeInteger(item.durationMin),
    )
  ) {
    return unavailable();
  }
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const durationMin = items.reduce((sum, item) => sum + item.durationMin, 0);
  if (!Number.isSafeInteger(subtotal)) return unavailable();
  if (durationMin > BOOKING_MAX_DURATION_MIN) {
    return {
      ok: false,
      status: 400,
      errors: {
        serviceIds:
          "Các dịch vụ này cần hơn 48 giờ. Vui lòng tách thành các lịch hẹn riêng.",
      },
    };
  }
  return { ok: true, data: { items, subtotal, durationMin } };
}
