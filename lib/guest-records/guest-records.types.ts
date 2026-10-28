// Shapes for the browser-keyed guest record index: every booking, rescue or
// parts order an anonymous visitor files is tied to their fw_gid cookie, so
// any tab of the same browser can find it again.
import type {
  GuestRecordSummary,
  GuestRecordType,
} from "@/lib/guest-access/guest-access.types";

export type GuestGidRecordRef = {
  record_type: GuestRecordType;
  record_id: string;
  created_at: Date | null;
};

export type PutGuestGidRecordRef = {
  guestId: string;
  recordType: GuestRecordType;
  recordId: string;
  createdAt: Date;
  ttlSeconds: number;
};

/** GET /api/guest-access/recent response body. */
export type RecentGuestRecords = {
  records: GuestRecordSummary[];
};
