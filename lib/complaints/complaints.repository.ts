import { scylla } from "@/lib/db/client";
import type { ComplaintRow } from "./complaint.types";

function toComplaintRow(row: Record<string, unknown>): ComplaintRow {
  return {
    complaint_id: String(row.complaint_id),
    reporter_name: (row.reporter_name as string | null) ?? null,
    reporter_phone: (row.reporter_phone as string | null) ?? null,
    target_user_id: row.target_user_id ? String(row.target_user_id) : null,
    target_name: (row.target_name as string | null) ?? null,
    ref_type: (row.ref_type as string | null) ?? null,
    ref_id: (row.ref_id as string | null) ?? null,
    subject: (row.subject as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    resolution_note: (row.resolution_note as string | null) ?? null,
    month_bucket: (row.month_bucket as string | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    updated_at: (row.updated_at as Date | null) ?? null,
    resolved_at: (row.resolved_at as Date | null) ?? null,
  };
}

// Complaint tables are tiny (admin-handled records), so a full-table
// scan is intentional here, mirroring the catalog config tables.
export async function listComplaintRows(): Promise<ComplaintRow[]> {
  const result = await scylla.execute(
    "SELECT complaint_id, reporter_name, reporter_phone, target_user_id, target_name, ref_type, ref_id, subject, body, status, resolution_note, month_bucket, created_at, updated_at, resolved_at FROM complaints_by_id",
    [],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toComplaintRow(r as unknown as Record<string, unknown>),
  );
}

export async function findComplaintRowById(
  complaintId: string,
): Promise<ComplaintRow | null> {
  const result = await scylla.execute(
    "SELECT complaint_id, reporter_name, reporter_phone, target_user_id, target_name, ref_type, ref_id, subject, body, status, resolution_note, month_bucket, created_at, updated_at, resolved_at FROM complaints_by_id WHERE complaint_id = ?",
    [complaintId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toComplaintRow(row) : null;
}

export type InsertComplaintParams = {
  complaintId: string;
  reporterName: string;
  reporterPhone: string;
  targetUserId: string | null;
  targetName: string;
  refType: string;
  refId: string;
  subject: string;
  body: string;
  monthBucket: string;
  now: Date;
};

export async function insertComplaint(
  params: InsertComplaintParams,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO complaints_by_id (complaint_id, reporter_name, reporter_phone, target_user_id, target_name, ref_type, ref_id, subject, body, status, resolution_note, month_bucket, created_at, updated_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', '', ?, ?, ?, null)",
        params: [
          params.complaintId,
          params.reporterName,
          params.reporterPhone,
          params.targetUserId,
          params.targetName,
          params.refType,
          params.refId,
          params.subject,
          params.body,
          params.monthBucket,
          params.now,
          params.now,
        ],
      },
      {
        query:
          "INSERT INTO complaints_by_status (status, month_bucket, created_at, complaint_id, subject, reporter_phone) VALUES ('open', ?, ?, ?, ?, ?)",
        params: [
          params.monthBucket,
          params.now,
          params.complaintId,
          params.subject,
          params.reporterPhone,
        ],
      },
    ],
    { prepare: true },
  );
}

export type UpdateComplaintStatusParams = {
  complaintId: string;
  oldStatus: string;
  monthBucket: string;
  createdAt: Date;
  status: string;
  resolutionNote: string;
  resolvedAt: Date | null;
  updatedAt: Date;
  subject: string;
  reporterPhone: string;
};

export async function updateComplaintStatus(
  params: UpdateComplaintStatusParams,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "UPDATE complaints_by_id SET status = ?, resolution_note = ?, resolved_at = ?, updated_at = ? WHERE complaint_id = ?",
        params: [
          params.status,
          params.resolutionNote,
          params.resolvedAt,
          params.updatedAt,
          params.complaintId,
        ],
      },
      {
        query:
          "DELETE FROM complaints_by_status WHERE status = ? AND month_bucket = ? AND created_at = ? AND complaint_id = ?",
        params: [
          params.oldStatus,
          params.monthBucket,
          params.createdAt,
          params.complaintId,
        ],
      },
      {
        query:
          "INSERT INTO complaints_by_status (status, month_bucket, created_at, complaint_id, subject, reporter_phone) VALUES (?, ?, ?, ?, ?, ?)",
        params: [
          params.status,
          params.monthBucket,
          params.createdAt,
          params.complaintId,
          params.subject,
          params.reporterPhone,
        ],
      },
    ],
    { prepare: true },
  );
}
