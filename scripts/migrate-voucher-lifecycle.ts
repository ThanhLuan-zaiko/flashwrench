// Non-destructive migration for the campaign gallery + trash lifecycle:
// adds the images list and the is_deleted/deleted_at flags, then backfills
// images from the legacy single image_url so existing covers keep showing.
// Safe to re-run: duplicate-column errors are skipped, backfilled rows are
// skipped. No data is dropped or reset.
// Usage: bun run scripts/migrate-voucher-lifecycle.ts
import { scylla } from "../lib/db/client";

const STATEMENTS = [
  {
    label: "voucher_campaigns_by_id.images",
    cql: "ALTER TABLE voucher_campaigns_by_id ADD images list<text>",
  },
  {
    label: "voucher_campaigns_by_id.is_deleted",
    cql: "ALTER TABLE voucher_campaigns_by_id ADD is_deleted boolean",
  },
  {
    label: "voucher_campaigns_by_id.deleted_at",
    cql: "ALTER TABLE voucher_campaigns_by_id ADD deleted_at timestamp",
  },
];

function isAlreadyApplied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|conflicts with|duplicate|Invalid column/i.test(
    message,
  );
}

// Copy the legacy single cover into the new images list for rows that
// have an image_url but no gallery yet. NULL is_deleted stays falsy —
// readers treat it as "not deleted".
async function backfillImages(): Promise<number> {
  const rows = await scylla.execute(
    "SELECT campaign_id, image_url, images FROM voucher_campaigns_by_id",
    [],
    { prepare: false },
  );
  let backfilled = 0;
  for (const row of rows.rows) {
    const record = row as unknown as {
      campaign_id: { toString(): string };
      image_url: string | null;
      images: string[] | null;
    };
    const cover = record.image_url?.trim();
    if (!cover || (record.images && record.images.length > 0)) continue;
    const campaignId = record.campaign_id.toString();
    await scylla.execute(
      "UPDATE voucher_campaigns_by_id SET images = ? WHERE campaign_id = ?",
      [[cover], campaignId],
      { prepare: true },
    );
    backfilled += 1;
    console.log(`  ~ ${campaignId}: image_url -> images[0]`);
  }
  return backfilled;
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(`[migrate:voucher-lifecycle] Applying to "${keyspace}"...`);
  try {
    await scylla.connect();
    for (const statement of STATEMENTS) {
      try {
        await scylla.execute(statement.cql, [], { prepare: false });
        console.log(`  + ${statement.label}: applied`);
      } catch (error) {
        if (!isAlreadyApplied(error)) throw error;
        console.log(`  = ${statement.label}: already present, skipped`);
      }
    }
    const backfilled = await backfillImages();
    console.log(
      `[migrate:voucher-lifecycle] Done — ${backfilled} campaign(s) backfilled.`,
    );
    return 0;
  } catch (error) {
    console.error(
      `[migrate:voucher-lifecycle] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
