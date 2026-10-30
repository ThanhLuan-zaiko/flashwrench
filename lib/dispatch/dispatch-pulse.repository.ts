// Raw CQL for the dispatch pulse: open rescues with the columns the board
// header shows. One partition per status, newest first by clustering.
import { scylla } from "@/lib/db/client";

export type OpenRescueRow = {
  request_id: string;
  status: string;
  created_at: Date | null;
  issue_type: string | null;
  priority: string | null;
};

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date : null;
}

function toText(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

export async function listOpenRescueRows(
  status: string,
  limit: number,
): Promise<OpenRescueRow[]> {
  const result = await scylla.execute(
    "SELECT request_id, status, created_at, issue_type, priority FROM emergency_by_status WHERE status = ? LIMIT ?",
    [status, limit],
    { prepare: true },
  );
  return result.rows.map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    return {
      request_id: String(row.request_id),
      status: String(row.status),
      created_at: toDate(row.created_at),
      issue_type: toText(row.issue_type),
      priority: toText(row.priority),
    };
  });
}
