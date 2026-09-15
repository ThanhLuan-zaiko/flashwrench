// Shared row/response shapes for the complaint domain.
// Repositories map raw CQL rows to these rows; services map rows to items.

export type ComplaintStatus = "open" | "in_review" | "resolved" | "rejected";

export type ComplaintRefType =
  | "booking"
  | "emergency"
  | "order"
  | "account"
  | "other";

export type ComplaintRow = {
  complaint_id: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  target_user_id: string | null;
  target_name: string | null;
  ref_type: string | null;
  ref_id: string | null;
  subject: string | null;
  body: string | null;
  status: string | null;
  resolution_note: string | null;
  month_bucket: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  resolved_at: Date | null;
};

export type ComplaintByStatusRow = {
  status: string;
  month_bucket: string;
  created_at: Date | null;
  complaint_id: string;
  subject: string | null;
  reporter_phone: string | null;
};

export type ComplaintItem = {
  id: string;
  reporterName: string;
  reporterPhone: string;
  targetUserId: string | null;
  targetName: string;
  refType: ComplaintRefType;
  refId: string;
  subject: string;
  body: string;
  status: ComplaintStatus;
  resolutionNote: string;
  monthBucket: string;
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
};

export type CreateComplaintInput = {
  reporterName: string;
  reporterPhone?: string;
  targetUserId?: string;
  targetName?: string;
  refType?: ComplaintRefType;
  refId?: string;
  subject: string;
  body: string;
};

export type ComplaintAction = "start-review" | "resolve" | "reject" | "reopen";

export type TransitionComplaintInput = {
  action: ComplaintAction;
  note?: string;
};

export type ComplaintFieldErrors = Partial<
  Record<
    | "reporterName"
    | "reporterPhone"
    | "targetUserId"
    | "targetName"
    | "refType"
    | "refId"
    | "subject"
    | "body"
    | "note"
    | "status"
    | "form",
    string
  >
>;

export function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function isOpenStatus(value: string | null): boolean {
  return value === "open" || value === "in_review";
}
