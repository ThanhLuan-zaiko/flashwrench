import { randomUUID } from "node:crypto";
import { monthBucket, type PublicUser } from "@/lib/auth/user.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import { isUuid } from "@/lib/validation";
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
  listComplaintRowsByUser,
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
    reporterUserId: row.reporter_user_id,
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
    reporterUserId: raw.reporterUserId?.trim() || null,
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

// Ref ownership check for customer-filed complaints. Only refs the
// customer actually owns can be cited; everything else reads as a
// plain 404 so existence is never leaked.
async function ownsRef(
  userId: string,
  refType: ComplaintRefType,
  refId: string,
): Promise<boolean> {
  if (refType === "booking") {
    const row = await findBookingRowById(refId);
    return row !== null && row.customer_id === userId;
  }
  if (refType === "order") {
    const row = await findOrderRowById(refId);
    return row !== null && row.customer_id === userId;
  }
  if (refType === "emergency") {
    const row = await findRescueRowById(refId);
    return row !== null && row.customer_id === userId;
  }
  return true;
}

// Self-service path: the signed-in customer files a complaint, reporter
// identity comes from the session (no free-text name spoofing).
export async function createCustomerComplaint(
  user: PublicUser,
  raw: {
    targetUserId?: string;
    targetName?: string;
    refType?: string;
    refId?: string;
    subject?: string;
    body?: string;
  },
): Promise<ComplaintResult<ComplaintItem>> {
  const fieldErrors = validateComplaintInput({
    reporterName: user.fullName,
    reporterPhone: user.phone,
    targetUserId: raw.targetUserId,
    targetName: raw.targetName,
    refType: raw.refType,
    refId: raw.refId,
    subject: raw.subject ?? "",
    body: raw.body ?? "",
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const refType = (raw.refType ?? "other") as ComplaintRefType;
  const refId = (raw.refId ?? "").trim();
  const ownedTypes: ComplaintRefType[] = ["booking", "order", "emergency"];
  if (ownedTypes.includes(refType)) {
    if (!refId || !isUuid(refId)) {
      return failFields(400, { refId: "Mã liên quan không hợp lệ." });
    }
    if (!(await ownsRef(user.id, refType, refId))) {
      return fail(404, "Không tìm thấy mục bạn muốn phản ánh.");
    }
  }

  return createComplaint({
    reporterUserId: user.id,
    reporterName: user.fullName,
    reporterPhone: user.phone,
    targetUserId: raw.targetUserId,
    targetName: raw.targetName,
    refType,
    refId,
    subject: raw.subject ?? "",
    body: raw.body ?? "",
  });
}

// The customer's own complaint list, newest first via complaints_by_user.
export async function listMyComplaints(
  userId: string,
): Promise<ComplaintResult<ComplaintItem[]>> {
  if (!isUuid(userId)) return fail(400, "Mã người dùng không hợp lệ.");
  const rows = await listComplaintRowsByUser(userId, 50);
  return { ok: true, data: rows.map(toItem) };
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
    reporterUserId: existing.reporter_user_id,
  });
  const row = await findComplaintRowById(complaintId);
  if (!row) return fail(500, "Không cập nhật được khiếu nại.");
  return { ok: true, data: toItem(row) };
}

export function countOpenComplaints(items: ComplaintItem[]): number {
  return items.filter((c) => isOpenStatus(c.status)).length;
}
