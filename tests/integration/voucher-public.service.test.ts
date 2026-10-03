// Public feed: live campaigns pass, deleted/inactive/expired/sold-out
// campaigns never reach customer advertising. Storage is stubbed.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherStubs,
} from "../helpers/service-mocks";
import { makeCampaignRow } from "../helpers/voucher.fixtures";

mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);

import {
  getPublicCampaignBySlug,
  listPublicCampaigns,
} from "@/lib/vouchers/voucher-public.service";

beforeEach(() => {
  resetServiceMocks();
});

describe("listPublicCampaigns", () => {
  test("returns only live campaigns newest first", async () => {
    voucherStubs.campaignRows = [
      makeCampaignRow({
        campaign_id: "live-new",
        slug: "live-new",
        code: "LIVE_NEW",
        created_at: new Date("2026-10-02T00:00:00.000Z"),
      }),
      makeCampaignRow({
        campaign_id: "live-old",
        slug: "live-old",
        code: "LIVE_OLD",
        created_at: new Date("2026-10-01T00:00:00.000Z"),
      }),
      makeCampaignRow({
        campaign_id: "trashed",
        slug: "trashed",
        code: "TRASHED",
        is_deleted: true,
      }),
      makeCampaignRow({
        campaign_id: "paused",
        slug: "paused",
        code: "PAUSED",
        is_active: false,
      }),
      makeCampaignRow({
        campaign_id: "soldout",
        slug: "soldout",
        code: "SOLDOUT",
        total_limit: 5,
        granted_count: 5,
      }),
      makeCampaignRow({
        campaign_id: "expired",
        slug: "expired",
        code: "EXPIRED",
        end_at: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ];
    const result = await listPublicCampaigns(
      new Date("2026-10-03T00:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.id)).toEqual([
      "live-new",
      "live-old",
    ]);
  });

  test("returns an empty feed when nothing is live", async () => {
    voucherStubs.campaignRows = [
      makeCampaignRow({ is_active: false, campaign_id: "off" }),
    ];
    const result = await listPublicCampaigns(
      new Date("2026-10-03T00:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([]);
  });
});

describe("getPublicCampaignBySlug", () => {
  test("returns the live campaign for a known slug", async () => {
    voucherStubs.campaignSlugOwner = "camp-live";
    voucherStubs.campaignById = makeCampaignRow({
      campaign_id: "camp-live",
      slug: "chao-mung",
    });
    const result = await getPublicCampaignBySlug(
      "chao-mung",
      new Date("2026-10-03T00:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.slug).toBe("chao-mung");
  });

  test("404s unknown slugs and finished campaigns", async () => {
    voucherStubs.campaignSlugOwner = null;
    voucherStubs.campaignById = null;
    const missing = await getPublicCampaignBySlug("khong-co");
    expect(missing.ok).toBe(false);

    voucherStubs.campaignSlugOwner = "camp-old";
    voucherStubs.campaignById = makeCampaignRow({
      campaign_id: "camp-old",
      slug: "het-han",
      end_at: new Date("2026-01-01T00:00:00.000Z"),
    });
    const expired = await getPublicCampaignBySlug(
      "het-han",
      new Date("2026-10-03T00:00:00.000Z"),
    );
    expect(expired.ok).toBe(false);
    if (expired.ok) return;
    expect(expired.status).toBe(404);
  });
});
