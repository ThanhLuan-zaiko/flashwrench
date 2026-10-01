// Raw CQL for the email-keyed guest record index. No business logic: the
// service decides what a visitor is allowed to read.
import { scylla } from "@/lib/db/client";
import type { GuestRecordType } from "./guest-access.types";

export type GuestRecordRef = {
  record_type: GuestRecordType;
  record_id: string;
  created_at: Date | null;
  phone: string | null;
};

export type PutGuestRecordRef = {
  email: string;
  recordType: GuestRecordType;
  recordId: string;
  phone: string | null;
  createdAt: Date;
};

export async function putGuestRecordRef(
  write: PutGuestRecordRef,
): Promise<void> {
  await scylla.execute(
    `INSERT INTO guest_records_by_email (email, created_at, record_type, record_id, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [
      write.email,
      write.createdAt,
      write.recordType,
      write.recordId,
      write.phone,
    ],
    { prepare: true },
  );
}

// An email partition holds one row per anonymous job a person ever filed, so
// a bounded read is the whole lookup. The cap keeps a pathological address
// from ballooning the response.
const LIST_LIMIT = 50;

export async function listGuestRecordRefsByEmail(
  email: string,
  limit = LIST_LIMIT,
): Promise<GuestRecordRef[]> {
  const result = await scylla.execute(
    `SELECT record_type, record_id, created_at, phone FROM guest_records_by_email
     WHERE email = ? LIMIT ?`,
    [email, limit],
    { prepare: true },
  );
  return (result.rows as unknown as Record<string, unknown>[]).map((row) => ({
    record_type: String(row.record_type) as GuestRecordType,
    record_id: String(row.record_id),
    created_at: (row.created_at as Date | null) ?? null,
    phone: (row.phone as string | null) ?? null,
  }));
}

export async function deleteGuestRecordRef(
  email: string,
  recordId: string,
): Promise<void> {
  // record_type and created_at are clustering columns, so the primary key
  // is only complete with them. The claim service reads the ref first and
  // passes back what it found.
  const refs = await listGuestRecordRefsByEmail(email);
  const targets = refs.filter((ref) => ref.record_id === recordId);
  if (targets.length === 0) return;

  await scylla.batch(
    targets.map((ref) => ({
      query:
        "DELETE FROM guest_records_by_email WHERE email = ? AND created_at = ? AND record_type = ? AND record_id = ?",
      params: [email, ref.created_at, ref.record_type, ref.record_id],
    })),
    { prepare: true },
  );
}
