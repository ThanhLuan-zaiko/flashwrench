// Pure public-visibility rule for campaigns: only live campaigns
// customers may see — active, not deleted, inside the time window and
// not sold out. Kept pure so both the public feed and the redeem-code
// service can share it without pulling extra repositories.
import type { CampaignRow } from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";

export function isPublicVisible(
  row: CampaignRow,
  now: Date = new Date(),
): boolean {
  if (isDeletedFlag(row.is_deleted)) return false;
  if (row.is_active !== true) return false;
  if (row.start_at && now < row.start_at) return false;
  if (row.end_at && now > row.end_at) return false;
  const total = row.total_limit ?? 0;
  const granted = row.granted_count ?? 0;
  if (total > 0 && granted >= total) return false;
  return true;
}
