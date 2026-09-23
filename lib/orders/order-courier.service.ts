import { findUserById } from "@/lib/auth/user.repository";
import { isUuid } from "@/lib/validation";
import {
  type CourierConfigInput,
  type CourierType,
  isCourierType,
  type OrderFieldErrors,
  type OrdersResult,
} from "./orders.types";

// Delivery assignment resolved from the dispatcher's courier payload.
// Mechanic couriers must point at a real active mechanic; third-party
// carriers carry a display name plus the carrier's own tracking code.
export type ResolvedCourier = {
  type: CourierType;
  courierId: string | null;
  courierName: string | null;
  trackingCode: string | null;
};

function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}

export async function resolveCourierConfig(
  input: CourierConfigInput | undefined,
): Promise<OrdersResult<ResolvedCourier>> {
  if (!input || !isCourierType(input.type)) {
    return failFields(400, {
      courier: "Vui lòng chọn đơn vị giao hàng (thợ hoặc bên thứ ba).",
    });
  }
  if (input.type === "mechanic") {
    const mechanicId =
      typeof input.mechanicId === "string" ? input.mechanicId : "";
    if (!isUuid(mechanicId)) {
      return failFields(400, {
        mechanicId: "Vui lòng chọn thợ giao hàng.",
      });
    }
    const user = await findUserById(mechanicId);
    if (!user || user.role !== "mechanic" || user.status !== "active") {
      return failFields(400, {
        mechanicId: "Thợ đã chọn không khả dụng. Vui lòng chọn thợ khác.",
      });
    }
    return {
      ok: true,
      data: {
        type: "mechanic",
        courierId: mechanicId,
        courierName: user.full_name ?? "",
        trackingCode: null,
      },
    };
  }
  const carrierName = (input.carrierName ?? "").trim().replace(/\s+/g, " ");
  if (carrierName.length < 2 || carrierName.length > 100) {
    return failFields(400, {
      carrierName: "Tên đơn vị vận chuyển phải từ 2 đến 100 ký tự.",
    });
  }
  const trackingCode = (input.trackingCode ?? "").trim();
  if (trackingCode.length < 3 || trackingCode.length > 64) {
    return failFields(400, {
      trackingCode: "Mã vận đơn phải từ 3 đến 64 ký tự.",
    });
  }
  return {
    ok: true,
    data: {
      type: "third_party",
      courierId: null,
      courierName: carrierName,
      trackingCode,
    },
  };
}
