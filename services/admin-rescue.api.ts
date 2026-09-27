import type { DispatchConfig } from "@/lib/rescue/rescue-config.service";
import type { ZoneItem } from "@/lib/zones/zone.service";
import { AuthApiError, apiRequest } from "./auth.api";

export type { DispatchConfig, ZoneItem };
export { AuthApiError };

// Admin rescue endpoints return zone/SLA field errors, not auth fields,
// so callers narrow on this shape instead of AuthApiError.
export class AdminRescueApiError extends Error {
  status: number;
  errors: Record<string, string>;

  constructor(status: number, errors: Record<string, string>) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "AdminRescueApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function adminRescueRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return await apiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw new AdminRescueApiError(
        error.status,
        error.errors as Record<string, string>,
      );
    }
    throw error;
  }
}

export function fetchAdminZones(): Promise<{ items: ZoneItem[] }> {
  return adminRescueRequest<{ items: ZoneItem[] }>("/api/admin/zones");
}

export type ZonePayload = {
  name: string;
  city?: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive?: boolean;
};

export function createAdminZone(
  payload: ZonePayload,
): Promise<{ item: ZoneItem }> {
  return adminRescueRequest<{ item: ZoneItem }>("/api/admin/zones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminZone(
  zoneId: string,
  payload: ZonePayload,
): Promise<{ item: ZoneItem }> {
  return adminRescueRequest<{ item: ZoneItem }>(
    `/api/admin/zones/${encodeURIComponent(zoneId)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function fetchDispatchConfig(): Promise<{ config: DispatchConfig }> {
  return adminRescueRequest<{ config: DispatchConfig }>(
    "/api/admin/rescue-config",
  );
}

export type SlaPayload = {
  offerTimeoutSec: number;
  maxReoffers: number;
  candidateLimit: number;
};

export function updateDispatchConfig(
  payload: SlaPayload,
): Promise<{ config: DispatchConfig }> {
  return adminRescueRequest<{ config: DispatchConfig }>(
    "/api/admin/rescue-config",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
