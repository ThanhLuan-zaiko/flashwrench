import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";
import { apiRequest } from "./auth.api";

export type { MechanicDirectoryItem };

export type MechanicsQuery = {
  lat?: number;
  lng?: number;
  limit?: number;
};

function toQueryString(query: MechanicsQuery): string {
  const params = new URLSearchParams();
  if (query.lat !== undefined) params.set("lat", String(query.lat));
  if (query.lng !== undefined) params.set("lng", String(query.lng));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

// Bookable mechanics for the customer picker. Authenticated HTTPS with
// the shared access-refresh retry, like every other booking call.
export function fetchAvailableMechanics(
  query: MechanicsQuery = {},
): Promise<{ mechanics: MechanicDirectoryItem[] }> {
  return apiRequest<{ mechanics: MechanicDirectoryItem[] }>(
    `/api/mechanics${toQueryString(query)}`,
  );
}
