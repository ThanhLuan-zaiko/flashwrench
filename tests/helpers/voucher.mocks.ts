// Shared repository stubs for the voucher wallet suites. Tests mutate
// `voucherStubs` and assert on `mock.calls`. Nothing touches a real
// database. Extend these handles instead of inventing file-local mocks
// for the same modules.
import { mock } from "bun:test";
import type { CampaignRow, WalletRow } from "@/lib/vouchers/voucher.types";
import type {
  GrantSlotOutcome,
  InsertCampaignParams,
  UpdateCampaignParams,
} from "@/lib/vouchers/voucher-campaign.repository";
import type {
  InsertWalletParams,
  WalletIdPage,
  WalletTransitionParams,
} from "@/lib/vouchers/voucher-wallet.repository";

export const voucherStubs = {
  campaignById: null as CampaignRow | null,
  campaignCodeOwner: null as string | null,
  campaignCodeClaimed: true,
  campaignSlugOwner: null as string | null,
  campaignSlugClaimed: true,
  campaignRows: [] as CampaignRow[],
  walletById: null as WalletRow | null,
  walletRowsByUser: [] as WalletRow[],
  walletIdPageState: null as string | null,
  userCampaignCount: 0,
  // Active wallets the campaign still owns — hard delete refuses while
  // this is above zero, same as the real partition scan.
  campaignActiveWallets: 0,
  // Forces every commitWalletTransition to lose its CAS race, so a test
  // can simulate a concurrent spend winning first.
  casRejected: false,
  // Overrides claimGrantSlot's computed outcome when set.
  grantSlotOutcome: null as GrantSlotOutcome | null,
  insertedWallets: [] as InsertWalletParams[],
  insertedCampaigns: [] as InsertCampaignParams[],
  deletedCampaigns: [] as {
    campaignId: string;
    isDeleted: boolean;
    deletedAt: Date | null;
  }[],
  purgedCampaigns: [] as {
    campaignId: string;
    code: string;
    slug: string;
  }[],
  statusMarks: [] as {
    walletId: string;
    status: string;
    usedOrderId: string | null;
    usedBookingId: string | null;
  }[],
};

export const voucherCampaignRepoMocks = {
  listCampaignRows: mock(
    async (): Promise<CampaignRow[]> => voucherStubs.campaignRows,
  ),
  findCampaignRowById: mock(
    async (_campaignId: string): Promise<CampaignRow | null> =>
      voucherStubs.campaignById,
  ),
  findCampaignIdByCode: mock(
    async (_code: string): Promise<string | null> =>
      voucherStubs.campaignCodeOwner,
  ),
  findCampaignIdBySlug: mock(
    async (_slug: string): Promise<string | null> =>
      voucherStubs.campaignSlugOwner,
  ),
  claimCampaignSlug: mock(
    async (_slug: string, _campaignId: string): Promise<boolean> =>
      voucherStubs.campaignSlugClaimed,
  ),
  releaseCampaignSlug: mock(
    async (_slug: string, _campaignId: string): Promise<boolean> => true,
  ),
  insertCampaign: mock(async (params: InsertCampaignParams): Promise<void> => {
    voucherStubs.insertedCampaigns.push(params);
  }),
  claimCampaignCode: mock(
    async (_code: string, _campaignId: string): Promise<boolean> =>
      voucherStubs.campaignCodeClaimed,
  ),
  releaseCampaignCode: mock(
    async (_code: string, _campaignId: string): Promise<boolean> => true,
  ),
  updateCampaignRows: mock(
    async (_params: UpdateCampaignParams): Promise<void> => undefined,
  ),
  setCampaignActive: mock(
    async (_campaignId: string, _isActive: boolean): Promise<void> => undefined,
  ),
  setCampaignDeleted: mock(
    async (
      campaignId: string,
      isDeleted: boolean,
      deletedAt: Date | null,
    ): Promise<void> => {
      voucherStubs.deletedCampaigns.push({ campaignId, isDeleted, deletedAt });
      if (voucherStubs.campaignById?.campaign_id === campaignId) {
        voucherStubs.campaignById = {
          ...voucherStubs.campaignById,
          is_deleted: isDeleted,
          deleted_at: deletedAt,
        };
      }
    },
  ),
  hardDeleteCampaign: mock(
    async (params: {
      campaignId: string;
      code: string;
      slug: string;
    }): Promise<void> => {
      voucherStubs.purgedCampaigns.push(params);
    },
  ),
  // Mirrors the real CAS loop closely enough for service tests: the stub
  // campaign is the row being claimed, and a sold-out fixture returns
  // "limit" exactly like the database would.
  claimGrantSlot: mock(
    async (
      _campaignId: string,
      totalLimit: number,
    ): Promise<GrantSlotOutcome> => {
      if (voucherStubs.grantSlotOutcome) return voucherStubs.grantSlotOutcome;
      const row = voucherStubs.campaignById;
      if (!row) return "error";
      const current = row.granted_count ?? 0;
      if (totalLimit > 0 && current >= totalLimit) return "limit";
      voucherStubs.campaignById = { ...row, granted_count: current + 1 };
      return "ok";
    },
  ),
  releaseGrantSlot: mock(
    async (_campaignId: string): Promise<void> => undefined,
  ),
};

export const voucherWalletRepoMocks = {
  findWalletRowById: mock(
    async (_walletId: string): Promise<WalletRow | null> =>
      voucherStubs.walletById,
  ),
  // Serves one page of index ids from the same fixture list the row
  // fan-out reads — paging slices by limit so tests can walk pages.
  listWalletIdsByUser: mock(
    async (
      _userId: string,
      limit: number,
      _pageState?: string | null,
    ): Promise<WalletIdPage> => ({
      ids: voucherStubs.walletRowsByUser
        .slice(0, Math.min(Math.max(limit, 1), 100))
        .map((row) => row.wallet_id ?? "")
        .filter((id) => id !== ""),
      pageState: voucherStubs.walletIdPageState,
    }),
  ),
  listWalletRowsByIds: mock(
    async (walletIds: string[]): Promise<WalletRow[]> =>
      walletIds
        .map((id) =>
          voucherStubs.walletRowsByUser.find((row) => row.wallet_id === id),
        )
        .filter((row): row is WalletRow => row !== undefined),
  ),
  countUserWalletsForCampaign: mock(
    async (_userId: string, _campaignId: string): Promise<number> =>
      voucherStubs.userCampaignCount,
  ),
  countActiveWalletsForCampaign: mock(
    async (_campaignId: string): Promise<number> =>
      voucherStubs.campaignActiveWallets,
  ),
  insertWallet: mock(async (params: InsertWalletParams): Promise<void> => {
    voucherStubs.insertedWallets.push(params);
  }),
  // Mirrors the real CAS guard: unmet expectations (wrong status or a
  // ref that does not match) reject the transition without writing.
  commitWalletTransition: mock(
    async (params: WalletTransitionParams): Promise<boolean> => {
      if (voucherStubs.casRejected) return false;
      const row = voucherStubs.walletById;
      if (
        params.expectStatus !== undefined &&
        row?.status !== params.expectStatus
      ) {
        return false;
      }
      if (
        params.expectUsedOrderId != null &&
        row?.used_order_id !== params.expectUsedOrderId
      ) {
        return false;
      }
      if (
        params.expectUsedBookingId != null &&
        row?.used_booking_id !== params.expectUsedBookingId
      ) {
        return false;
      }
      voucherStubs.statusMarks.push({
        walletId: params.walletId,
        status: params.status,
        usedOrderId: params.usedOrderId,
        usedBookingId: params.usedBookingId,
      });
      if (voucherStubs.walletById?.wallet_id === params.walletId) {
        voucherStubs.walletById = {
          ...voucherStubs.walletById,
          status: params.status,
          used_at: params.usedAt,
          used_order_id: params.usedOrderId,
          used_booking_id: params.usedBookingId,
        };
      }
      return true;
    },
  ),
};

export const voucherRealtimeMocks = {
  publishCampaignChange: mock(
    async (_campaignId: string): Promise<void> => undefined,
  ),
  publishWalletChange: mock(
    async (_params: {
      kind: string;
      walletId: string;
      userId: string;
    }): Promise<void> => undefined,
  ),
};

export function resetVoucherMocks(): void {
  voucherStubs.campaignById = null;
  voucherStubs.campaignCodeOwner = null;
  voucherStubs.campaignCodeClaimed = true;
  voucherStubs.campaignSlugOwner = null;
  voucherStubs.campaignSlugClaimed = true;
  voucherStubs.campaignRows = [];
  voucherStubs.walletById = null;
  voucherStubs.walletRowsByUser = [];
  voucherStubs.walletIdPageState = null;
  voucherStubs.userCampaignCount = 0;
  voucherStubs.campaignActiveWallets = 0;
  voucherStubs.casRejected = false;
  voucherStubs.grantSlotOutcome = null;
  voucherStubs.insertedWallets = [];
  voucherStubs.insertedCampaigns = [];
  voucherStubs.deletedCampaigns = [];
  voucherStubs.purgedCampaigns = [];
  voucherStubs.statusMarks = [];
  for (const fn of Object.values(voucherCampaignRepoMocks)) fn.mockClear();
  for (const fn of Object.values(voucherWalletRepoMocks)) fn.mockClear();
  for (const fn of Object.values(voucherRealtimeMocks)) fn.mockClear();
}
