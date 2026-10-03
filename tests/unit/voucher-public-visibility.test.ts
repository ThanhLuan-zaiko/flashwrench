// Public visibility guard: only live campaigns reach customer ads.
import { describe, expect, test } from "bun:test";
import { isPublicVisible } from "@/lib/vouchers/voucher-public.service";
import { makeCampaignRow } from "../helpers/voucher.fixtures";

const NOW = new Date("2026-10-03T00:00:00.000Z");

describe("isPublicVisible", () => {
  test("accepts a live campaign", () => {
    expect(isPublicVisible(makeCampaignRow(), NOW)).toBe(true);
  });

  test("rejects deleted, inactive and sold-out campaigns", () => {
    expect(isPublicVisible(makeCampaignRow({ is_deleted: true }), NOW)).toBe(
      false,
    );
    expect(isPublicVisible(makeCampaignRow({ is_active: false }), NOW)).toBe(
      false,
    );
    expect(
      isPublicVisible(
        makeCampaignRow({ total_limit: 10, granted_count: 10 }),
        NOW,
      ),
    ).toBe(false);
  });

  test("rejects campaigns outside the time window", () => {
    expect(
      isPublicVisible(
        makeCampaignRow({ start_at: new Date("2026-10-04T00:00:00.000Z") }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isPublicVisible(
        makeCampaignRow({ end_at: new Date("2026-10-02T00:00:00.000Z") }),
        NOW,
      ),
    ).toBe(false);
  });

  test("keeps unlimited campaigns after many grants", () => {
    expect(
      isPublicVisible(
        makeCampaignRow({ total_limit: 0, granted_count: 5000 }),
        NOW,
      ),
    ).toBe(true);
  });
});
