import type {
  BusinessHours,
  BusinessHoursConfig,
} from "@/lib/shop/business-hours.types";
import type {
  ShopProfile,
  ShopProfileConfig,
} from "@/lib/shop/shop-profile.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type {
  BusinessHours,
  BusinessHoursConfig,
  ShopProfile,
  ShopProfileConfig,
};

// Shop settings endpoints return field errors keyed to the form
// inputs, so callers narrow on this shape instead of AuthApiError.
export class ShopSettingsApiError extends Error {
  status: number;
  errors: Record<string, string>;

  constructor(status: number, errors: Record<string, string>) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "ShopSettingsApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function shopSettingsRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return await apiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw new ShopSettingsApiError(
        error.status,
        error.errors as Record<string, string>,
      );
    }
    throw error;
  }
}

// Public reads — no session needed; the booking form and customer
// touchpoints render these values for guests too.
export function fetchPublicShopProfile(): Promise<ShopProfile> {
  return shopSettingsRequest<ShopProfile>("/api/shop-profile");
}

export function fetchPublicBusinessHours(): Promise<BusinessHours> {
  return shopSettingsRequest<BusinessHours>("/api/business-hours");
}

export function fetchAdminShopProfile(): Promise<{
  profile: ShopProfileConfig;
}> {
  return shopSettingsRequest<{ profile: ShopProfileConfig }>(
    "/api/admin/shop-profile",
  );
}

export function fetchAdminBusinessHours(): Promise<{
  hours: BusinessHoursConfig;
}> {
  return shopSettingsRequest<{ hours: BusinessHoursConfig }>(
    "/api/admin/business-hours",
  );
}

export type ShopProfilePayload = {
  displayName: string | null;
  hotline: string | null;
  address: string | null;
};

export function updateAdminShopProfile(
  payload: ShopProfilePayload,
): Promise<{ profile: ShopProfileConfig }> {
  return shopSettingsRequest<{ profile: ShopProfileConfig }>(
    "/api/admin/shop-profile",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export type BusinessHoursPayload = {
  enabled: boolean;
  opensAtMin: number;
  closesAtMin: number;
  timeZone: string;
};

export function updateAdminBusinessHours(
  payload: BusinessHoursPayload,
): Promise<{ hours: BusinessHoursConfig }> {
  return shopSettingsRequest<{ hours: BusinessHoursConfig }>(
    "/api/admin/business-hours",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
