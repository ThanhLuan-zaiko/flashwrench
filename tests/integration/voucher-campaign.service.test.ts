// Campaign lifecycle: slug-derived codes, claim/release ordering, and a
// locked slug/code identity on update. Storage is stubbed — nothing
// touches a real database.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { CreateCampaignInput } from "@/lib/vouchers/voucher.types";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherRedeemCodeRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  VOUCHER_CAMPAIGN_ID,
} from "../helpers/voucher.fixtures";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/media/media.service", () => ({
  claimAssetsForOwner: mock(async () => ({ ok: true, data: null })),
  pruneOwnerAssets: mock(async () => ({ deleted: 0 })),
}));
mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-redeem-code.repository",
  () => voucherRedeemCodeRepoMocks,
);

import {
  createCampaign,
  hardDeleteCampaignWithConfirm,
  restoreCampaign,
  softDeleteCampaign,
  toggleCampaign,
  updateCampaign,
} from "@/lib/vouchers/voucher-campaign.service";

function baseInput(
  overrides?: Partial<CreateCampaignInput>,
): CreateCampaignInput {
  return {
    slug: "chao-mung",
    name: "Chao mung tai khoan moi",
    description: "",
    images: [],
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 0,
    scope: "all",
    totalLimit: 100,
    perUserLimit: 1,
    allowDispatcherGrant: true,
    dispatcherMaxValue: 50000,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  resetServiceMocks();
});

describe("createCampaign", () => {
  test("derives the code from the slug and persists both", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    const result = await createCampaign("admin-1", baseInput());
    expect(result.ok).toBe(true);
    expect(voucherStubs.insertedCampaigns).toHaveLength(1);
    const inserted = voucherStubs.insertedCampaigns[0];
    expect(inserted.slug).toBe("chao-mung");
    expect(inserted.code).toBe("CHAO_MUNG");
  });

  test("rejects a slug that is already claimed", async () => {
    voucherStubs.campaignSlugOwner = "other-campaign";
    const result = await createCampaign("admin-1", baseInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.slug).toBeDefined();
    expect(voucherStubs.insertedCampaigns).toHaveLength(0);
  });

  test("rejects a slug whose derived code is already claimed", async () => {
    voucherStubs.campaignCodeOwner = "other-campaign";
    const result = await createCampaign("admin-1", baseInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.slug).toBeDefined();
    expect(voucherStubs.insertedCampaigns).toHaveLength(0);
  });

  test("loses the slug CAS race cleanly", async () => {
    voucherStubs.campaignSlugClaimed = false;
    const result = await createCampaign("admin-1", baseInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(voucherStubs.insertedCampaigns).toHaveLength(0);
  });

  test("loses the code CAS race and releases the slug claim", async () => {
    voucherStubs.campaignCodeClaimed = false;
    const result = await createCampaign("admin-1", baseInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(
      voucherCampaignRepoMocks.releaseCampaignSlug.mock.calls,
    ).toHaveLength(1);
    expect(voucherStubs.insertedCampaigns).toHaveLength(0);
  });
});

describe("updateCampaign", () => {
  test("rejects a slug change on an existing campaign", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    const result = await updateCampaign(
      VOUCHER_CAMPAIGN_ID,
      baseInput({ slug: "slug-khac" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.slug).toBeDefined();
    expect(voucherCampaignRepoMocks.updateCampaignRows).not.toHaveBeenCalled();
  });

  test("keeps the stored code and slug when the slug matches", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    const result = await updateCampaign(
      VOUCHER_CAMPAIGN_ID,
      baseInput({ name: "Ten moi hoan toan" }),
    );
    expect(result.ok).toBe(true);
    const update =
      voucherCampaignRepoMocks.updateCampaignRows.mock.calls[0]?.[0];
    expect(update?.slug).toBe("chao-mung");
    expect(update?.code).toBe("CHAO_MUNG");
  });

  test("refuses to edit a trashed campaign", async () => {
    voucherStubs.campaignById = makeCampaignRow({ is_deleted: true });
    const result = await updateCampaign(VOUCHER_CAMPAIGN_ID, baseInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(voucherCampaignRepoMocks.updateCampaignRows).not.toHaveBeenCalled();
  });
});

describe("campaign trash lifecycle", () => {
  test("soft delete stamps is_deleted and restore clears it", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    const soft = await softDeleteCampaign(VOUCHER_CAMPAIGN_ID);
    expect(soft.ok).toBe(true);
    const softMark = voucherStubs.deletedCampaigns[0];
    expect(softMark.isDeleted).toBe(true);
    expect(softMark.deletedAt).toBeInstanceOf(Date);

    const restored = await restoreCampaign(VOUCHER_CAMPAIGN_ID);
    expect(restored.ok).toBe(true);
    const restoreMark = voucherStubs.deletedCampaigns[1];
    expect(restoreMark.isDeleted).toBe(false);
    expect(restoreMark.deletedAt).toBeNull();
  });

  test("blocks toggle and double soft-delete inside the trash", async () => {
    voucherStubs.campaignById = makeCampaignRow({ is_deleted: true });
    const toggled = await toggleCampaign(VOUCHER_CAMPAIGN_ID, false);
    expect(toggled.ok).toBe(false);
    const again = await softDeleteCampaign(VOUCHER_CAMPAIGN_ID);
    expect(again.ok).toBe(false);
    expect(voucherStubs.deletedCampaigns).toHaveLength(0);
  });

  test("hard delete needs the slug echoed back", async () => {
    voucherStubs.campaignById = makeCampaignRow({ is_deleted: true });
    const wrong = await hardDeleteCampaignWithConfirm(
      VOUCHER_CAMPAIGN_ID,
      "khong-dung",
    );
    expect(wrong.ok).toBe(false);
    if (wrong.ok) return;
    expect(wrong.errors.confirm).toBeDefined();
    expect(voucherStubs.purgedCampaigns).toHaveLength(0);
  });

  test("hard delete refuses while wallets are still active", async () => {
    voucherStubs.campaignById = makeCampaignRow({ is_deleted: true });
    voucherStubs.campaignActiveWallets = 2;
    const result = await hardDeleteCampaignWithConfirm(
      VOUCHER_CAMPAIGN_ID,
      "chao-mung",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(voucherStubs.purgedCampaigns).toHaveLength(0);
    expect(
      voucherWalletRepoMocks.countActiveWalletsForCampaign,
    ).toHaveBeenCalled();
  });

  test("hard delete purges the row plus the code and slug claims", async () => {
    voucherStubs.campaignById = makeCampaignRow({ is_deleted: true });
    const result = await hardDeleteCampaignWithConfirm(
      VOUCHER_CAMPAIGN_ID,
      "CHAO-MUNG",
    );
    expect(result.ok).toBe(true);
    expect(voucherStubs.purgedCampaigns).toHaveLength(1);
    const purged = voucherStubs.purgedCampaigns[0];
    expect(purged.campaignId).toBe(VOUCHER_CAMPAIGN_ID);
    expect(purged.code).toBe("CHAO_MUNG");
    expect(purged.slug).toBe("chao-mung");
  });
});
