import type {
  ComplaintAction,
  ComplaintItem,
  ComplaintStatus,
  CreateComplaintInput,
} from "@/lib/complaints/complaint.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type {
  ComplaintAction,
  ComplaintItem,
  ComplaintStatus,
  CreateComplaintInput,
};
export { AuthApiError };

// Complaints: list supports ?status=open so the admin queue can show
// open records with handling actions and closed ones for audit.
export function fetchComplaints(query?: { status?: ComplaintStatus }): Promise<{
  complaints: ComplaintItem[];
}> {
  const suffix = query?.status ? `?status=${query.status}` : "";
  return apiRequest<{ complaints: ComplaintItem[] }>(
    `/api/admin/complaints${suffix}`,
  );
}

export function createComplaintRequest(
  payload: CreateComplaintInput,
): Promise<{ complaint: ComplaintItem }> {
  return apiRequest<{ complaint: ComplaintItem }>("/api/admin/complaints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function transitionComplaintRequest(
  complaintId: string,
  action: ComplaintAction,
  note?: string,
): Promise<{ complaint: ComplaintItem }> {
  return apiRequest<{ complaint: ComplaintItem }>(
    `/api/admin/complaints/${encodeURIComponent(complaintId)}`,
    { method: "PATCH", body: JSON.stringify({ action, note }) },
  );
}
