import type { RescueDetail } from "@/lib/rescue/rescue-reader.service";
import { AuthApiError, apiRequest } from "./auth.api";

export type { RescueDetail };
export { AuthApiError };

export type MechanicRescueAction =
  | "accept"
  | "decline"
  | "depart"
  | "arrive"
  | "complete";

// Mechanic inbox: offers currently assigned to me. Plain fetch with the
// session cookie; the shell invalidates it on every inbox realtime event.
export function fetchMechanicRescues(): Promise<{ items: RescueDetail[] }> {
  return apiRequest<{ items: RescueDetail[] }>("/api/mechanic/rescue");
}

export function rescueActionRequest(
  requestId: string,
  action: MechanicRescueAction,
): Promise<{ rescue: RescueDetail }> {
  return apiRequest<{ rescue: RescueDetail }>(
    `/api/rescue/${encodeURIComponent(requestId)}`,
    { method: "PATCH", body: JSON.stringify({ action }) },
  );
}

export function rescueExpireRequest(
  requestId: string,
): Promise<{ expired: boolean }> {
  return apiRequest<{ expired: boolean }>(
    `/api/rescue/${encodeURIComponent(requestId)}/expire`,
    { method: "POST" },
  );
}

// Dispatcher board page: cursor paging per status tab.
export function fetchDispatchRescues(
  status: string,
  cursor?: string | null,
): Promise<{ items: RescueDetail[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ status });
  if (cursor) params.set("cursor", cursor);
  return apiRequest<{ items: RescueDetail[]; nextCursor: string | null }>(
    `/api/dispatch/rescue?${params}`,
  );
}

export type DispatchRescueActionBody = {
  action: "assign" | "cancel" | "expire-now";
  mechanicId?: string;
  note?: string;
  expectedUpdatedAt: string | null;
};

// Dispatcher manual override on one rescue. Thin fetch: the service owns
// every rule (eligibility, version match, allowed transitions).
export function dispatchRescueActionRequest(
  requestId: string,
  body: DispatchRescueActionBody,
): Promise<{ rescue: RescueDetail }> {
  return apiRequest<{ rescue: RescueDetail }>(
    `/api/dispatch/rescue/${encodeURIComponent(requestId)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export type RescueDetailPayload = {
  rescue: RescueDetail;
  timeline: {
    changedAt: string;
    oldStatus: string | null;
    newStatus: string | null;
    note: string | null;
  }[];
};

export function fetchDispatchRescueDetail(
  requestId: string,
): Promise<RescueDetailPayload> {
  return apiRequest<RescueDetailPayload>(
    `/api/rescue/${encodeURIComponent(requestId)}`,
  );
}
