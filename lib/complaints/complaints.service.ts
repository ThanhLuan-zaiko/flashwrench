import { randomUUID } from "node:crypto";
import { monthBucket } from "@/lib/auth/user.types";
import type {
  ComplaintAction,
  ComplaintFieldErrors,
  ComplaintItem,
  ComplaintRefType,
  ComplaintRow,
  ComplaintStatus,
  CreateComplaintInput,
  TransitionComplaintInput,
} from "./complaint.types";
import { isOpenStatus, toIso } from "./complaint.types";
import {
  COMPLAINT_STATUSES,
  validateComplaintInput,
  validateTransitionInput,
} from "./complaint-validation";
import {
  findComplaintRowById,
  insertComplaint,
  listComplaintRows,
  updateComplaintStatus,
} from "./complaints.repository";

export type ListComplaintsParams = {
  status?: ComplaintStatus;
};

export type ComplaintResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: ComplaintFieldErrors };

function toItem(row: ComplaintRow): ComplaintItem {
  return {
    id: row.complaint_id,
    reporterName: row.reporter_name ?? "",
    reporterPhone: row.reporter_phone ?? "",
    targetUserId: row.target_user_id,
    targetName: row.target_name ?? "",
    refType: (row.ref_type as ComplaintRefType) ?? "other",
    refId: row.ref_id ?? "",
    subject: row.subject ?? "",
    body: row.body ?? "",
    status: (row.status as ComplaintStatus) ?? "open",
    resolutionNote: row.resolution_note ?? "",
    monthBucket: row.month_bucket ?? "",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    resolvedAt: toIso(row.resolved_at),
  };
}

function fail<T>(status: number, form: string): ComplaintResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: ComplaintFieldErrors,
): ComplaintResult<T> {
  return { ok: false, status, errors };
}

// List complaints newest-first, optionally narrowed to one status.
// The table is tiny (admin-handled records), so in-memory filtering
// mirrors the catalog config tables instead of ALLOW FILTERING.
export async function listComplaints(
  params: ListComplaintsParams = {},
): Promise<ComplaintResult<ComplaintItem[]>> {
  if (
    params.status !== undefined &&
    !COMPLAINT_STATUSES.includes(params.status)
  ) {
    return failFields(400, { status: "Trạng thái cần lọc không hợp lệ." });
  }
  const rows = await listComplaintRows();
  const items = rows
    .filter((r) => (params.status ? r.status === params.status : true))
    .map(toItem)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { ok: true, data: items };
}

export async function createComplaint(
  raw: CreateComplaintInput,
): Promise<ComplaintResult<ComplaintItem>> {
  const fieldErrors = validateComplaintInput({
    reporterName: raw.reporterName,
    reporterPhone: raw.reporterPhone,
    targetUserId: raw.targetUserId,
    targetName: raw.targetName,
    refType: raw.refType,
    refId: raw.refId,
    subject: raw.subject,
    body: raw.body,
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const now = new Date();
  const complaintId = randomUUID();
  await insertComplaint({
    complaintId,
    reporterName: raw.reporterName.trim(),
    reporterPhone: (raw.reporterPhone ?? "").trim(),
    targetUserId: (raw.targetUserId ?? "").trim() || null,
    targetName: (raw.targetName ?? "").trim(),
    refType: raw.refType ?? "other",
    refId: (raw.refId ?? "").trim(),
    subject: raw.subject.trim(),
    body: raw.body.trim(),
    monthBucket: monthBucket(now),
    now,
  });
  const row = await findComplaintRowById(complaintId);
  if (!row)
    return fail(500, "Không ghi nhận được khiếu nại. Vui lòng thử lại.");
  return { ok: true, data: toItem(row) };
}

function nextStatus(
  current: ComplaintStatus,
  action: ComplaintAction,
): ComplaintStatus | null {
  if (action === "start-review") return current === "open" ? "in_review" : null;
  if (action === "resolve")
    return current === "open" || current === "in_review" ? "resolved" : null;
  if (action === "reject")
    return current === "open" || current === "in_review" ? "rejected" : null;
  if (action === "reopen")
    return current === "resolved" || current === "rejected"
      ? "in_review"
      : null;
  return null;
}

// Move one complaint along the handling workflow. Resolve and reject
// require a note; reopen keeps the last note for audit trail.
export async function transitionComplaint(
  complaintId: string,
  raw: TransitionComplaintInput,
): Promise<ComplaintResult<ComplaintItem>> {
  const existing = await findComplaintRowById(complaintId);
  if (!existing) return fail(404, "Không tìm thấy khiếu nại.");
  const fieldErrors = validateTransitionInput({
    action: raw.action,
    note: raw.note,
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const current = (existing.status as ComplaintStatus) ?? "open";
  const status = nextStatus(current, raw.action);
  if (!status) {
    return fail(400, "Không thể thực hiện thao tác ở trạng thái hiện tại.");
  }
  const note = (raw.note ?? "").trim();
  const now = new Date();
  const resolved = status === "resolved" || status === "rejected";
  await updateComplaintStatus({
    complaintId,
    oldStatus: current,
    monthBucket: existing.month_bucket ?? monthBucket(now),
    createdAt: existing.created_at ?? now,
    status,
    resolutionNote: note || (existing.resolution_note ?? ""),
    resolvedAt: resolved ? now : null,
    updatedAt: now,
    subject: existing.subject ?? "",
    reporterPhone: existing.reporter_phone ?? "",
  });
  const row = await findComplaintRowById(complaintId);
  if (!row) return fail(500, "Không cập nhật được khiếu nại.");
  return { ok: true, data: toItem(row) };
}

export function countOpenComplaints(items: ComplaintItem[]): number {
  return items.filter((c) => isOpenStatus(c.status)).length;
}
