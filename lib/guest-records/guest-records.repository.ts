// Raw CQL for the browser-keyed guest record index (guest_records_by_gid).
// No business logic: the service validates ids and decides what to show.
import { scylla } from "@/lib/db/client";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import type {
  GuestGidRecordRef,
  PutGuestGidRecordRef,
} from "./guest-records.types";

export async function putGuestRecordRefByGid(
  write: PutGuestGidRecordRef,
): Promise<void> {
  await scylla.execute(
    `INSERT INTO guest_records_by_gid (guest_id, created_at, record_type, record_id)
     VALUES (?, ?, ?, ?) USING TTL ?`,
    [
      write.guestId,
      write.createdAt,
      write.recordType,
      write.recordId,
      write.ttlSeconds,
    ],
    { prepare: true },
  );
}

export async function listGuestRecordRefsByGid(
  guestId: string,
  limit: number,
): Promise<GuestGidRecordRef[]> {
  const result = await scylla.execute(
    `SELECT record_type, record_id, created_at FROM guest_records_by_gid
     WHERE guest_id = ? LIMIT ?`,
    [guestId, limit],
    { prepare: true },
  );
  return (result.rows as unknown as Record<string, unknown>[]).map((row) => ({
    record_type: String(row.record_type) as GuestRecordType,
    record_id: String(row.record_id),
    created_at: (row.created_at as Date | null) ?? null,
  }));
}
