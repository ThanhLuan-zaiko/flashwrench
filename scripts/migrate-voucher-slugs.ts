// Non-destructive migration for campaign slugs: adds the slug column,
// creates the slug claim table, then backfills every existing campaign
// with a slug derived from its code (claimed IF NOT EXISTS; collisions
// get a short id suffix). Safe to re-run: duplicate-column errors and
// already-backfilled rows are skipped. No data is dropped or reset.
// Usage: bun run scripts/migrate-voucher-slugs.ts

import { slugifyName } from "../lib/catalog/catalog-validation";
import { scylla } from "../lib/db/client";

const ADD_SLUG = "ALTER TABLE voucher_campaigns_by_id ADD slug text";
const CREATE_BY_SLUG = `CREATE TABLE IF NOT EXISTS voucher_campaigns_by_slug (
  slug        text PRIMARY KEY,
  campaign_id uuid
)`;

function isAlreadyApplied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|conflicts with|duplicate|Invalid column/i.test(
    message,
  );
}

// Slug for a legacy row: slugify the code, fall back to a campaign-<id>
// form when the code carries no slug-able characters, and suffix the id
// tail when two codes collapse onto one slug (e.g. TET-2026 / TET_2026).
async function claimSlug(slug: string, campaignId: string): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO voucher_campaigns_by_slug (slug, campaign_id) VALUES (?, ?) IF NOT EXISTS",
    [slug, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

async function backfillSlugs(): Promise<number> {
  const rows = await scylla.execute(
    "SELECT campaign_id, code, slug FROM voucher_campaigns_by_id",
    [],
    { prepare: false },
  );
  let backfilled = 0;
  for (const row of rows.rows) {
    const record = row as unknown as {
      campaign_id: { toString(): string };
      code: string | null;
      slug: string | null;
    };
    if (record.slug && record.slug.trim()) continue;
    const campaignId = record.campaign_id.toString();
    const suffix = campaignId.slice(0, 8);
    const base = (slugifyName(record.code ?? "") || `campaign-${suffix}`)
      .slice(0, 32)
      .replace(/-+$/, "");
    let slug = base.length >= 3 ? base : `campaign-${suffix}`;
    if (!(await claimSlug(slug, campaignId))) {
      slug = `${slug.slice(0, 23).replace(/-+$/, "")}-${suffix}`;
      if (!(await claimSlug(slug, campaignId))) {
        console.log(`  ! ${campaignId}: no claimable slug, skipped`);
        continue;
      }
    }
    await scylla.execute(
      "UPDATE voucher_campaigns_by_id SET slug = ? WHERE campaign_id = ?",
      [slug, campaignId],
      { prepare: true },
    );
    backfilled += 1;
    console.log(`  ~ ${record.code ?? campaignId} -> ${slug}`);
  }
  return backfilled;
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(`[migrate:voucher-slugs] Applying to "${keyspace}"...`);
  try {
    await scylla.connect();
    try {
      await scylla.execute(ADD_SLUG, [], { prepare: false });
      console.log("  + voucher_campaigns_by_id.slug: applied");
    } catch (error) {
      if (!isAlreadyApplied(error)) throw error;
      console.log("  = voucher_campaigns_by_id.slug: already present, skipped");
    }
    await scylla.execute(CREATE_BY_SLUG, [], { prepare: false });
    console.log("  + voucher_campaigns_by_slug: ready");
    const backfilled = await backfillSlugs();
    console.log(
      `[migrate:voucher-slugs] Done — ${backfilled} campaign(s) backfilled.`,
    );
    return 0;
  } catch (error) {
    console.error(
      `[migrate:voucher-slugs] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
