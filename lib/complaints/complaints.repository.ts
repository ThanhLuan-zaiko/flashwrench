import { scylla } from "@/lib/db/client";
import type { ComplaintRow } from "./complaint.types";

function toComplaintRow(row: Record<string, unknown>): ComplaintRow {
  return {
    complaint_id: String(row.complaint_id),
    reporter_user_id: row.reporter_user_id
      ? String(row.reporter_user_id)
      : null,
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

const COMPLAINT_COLUMNS =
  "complaint_id, reporter_user_id, reporter_name, reporter_phone, target_user_id, target_name, ref_type, ref_id, subject, body, status, resolution_note, month_bucket, created_at, updated_at, resolved_at";

// Complaint tables are tiny (admin-handled records), so a full-table
// scan is intentional here, mirroring the catalog config tables.
export async function listComplaintRows(): Promise<ComplaintRow[]> {
  const result = await scylla.execute(
    `SELECT ${COMPLAINT_COLUMNS} FROM complaints_by_id`,
    [],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toComplaintRow(r as unknown as Record<string, unknown>),
  );
}

// Customer-side list: ids from the per-user partition, then hydrated
// through complaints_by_id so stale mirrors never leak old statuses.
export async function listComplaintRowsByUser(
  userId: string,
  limit: number,
): Promise<ComplaintRow[]> {
  const refs = await scylla.execute(
    "SELECT complaint_id FROM complaints_by_user WHERE user_id = ? LIMIT ?",
    [userId, limit],
    { prepare: true },
  );
  const rows: ComplaintRow[] = [];
  for (const ref of refs.rows) {
    const id = String((ref as unknown as Record<string, unknown>).complaint_id);
    const row = await findComplaintRowById(id);
    if (row) rows.push(row);
  }
  return rows;
}

export async function findComplaintRowById(
  complaintId: string,
): Promise<ComplaintRow | null> {
  const result = await scylla.execute(
    `SELECT ${COMPLAINT_COLUMNS} FROM complaints_by_id WHERE complaint_id = ?`,
    [complaintId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toComplaintRow(row) : null;
}

export type InsertComplaintParams = {
  complaintId: string;
  reporterUserId: string | null;
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
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "INSERT INTO complaints_by_id (complaint_id, reporter_user_id, reporter_name, reporter_phone, target_user_id, target_name, ref_type, ref_id, subject, body, status, resolution_note, month_bucket, created_at, updated_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', '', ?, ?, ?, null)",
      params: [
        params.complaintId,
        params.reporterUserId,
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
  ];
  // Account-filed complaints also land on the per-user list so the
  // customer can follow their own reports.
  if (params.reporterUserId) {
    statements.push({
      query:
        "INSERT INTO complaints_by_user (user_id, created_at, complaint_id, subject, status, ref_type) VALUES (?, ?, ?, ?, 'open', ?)",
      params: [
        params.reporterUserId,
        params.now,
        params.complaintId,
        params.subject,
        params.refType,
      ],
    });
  }
  await scylla.batch(statements, { prepare: true });
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
  reporterUserId: string | null;
};

export async function updateComplaintStatus(
  params: UpdateComplaintStatusParams,
): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
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
  ];
  // Keep the owner's mirror row in sync so "Khiếu nại của tôi" shows
  // the live status without a second lookup.
  if (params.reporterUserId) {
    statements.push({
      query:
        "UPDATE complaints_by_user SET status = ? WHERE user_id = ? AND created_at = ? AND complaint_id = ?",
      params: [
        params.status,
        params.reporterUserId,
        params.createdAt,
        params.complaintId,
      ],
    });
  }
  await scylla.batch(statements, { prepare: true });
}
