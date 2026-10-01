// Shared repository stubs for the voucher wallet suites. Tests mutate
// `voucherStubs` and assert on `mock.calls`. Nothing touches a real
// database. Extend these handles instead of inventing file-local mocks
// for the same modules.
import { mock } from "bun:test";
import type { CampaignRow, WalletRow } from "@/lib/vouchers/voucher.types";
import type {
  InsertCampaignParams,
  UpdateCampaignParams,
} from "@/lib/vouchers/voucher-campaign.repository";
import type { InsertWalletParams } from "@/lib/vouchers/voucher-wallet.repository";

export const voucherStubs = {
  campaignById: null as CampaignRow | null,
  campaignCodeOwner: null as string | null,
  campaignCodeClaimed: true,
  campaignRows: [] as CampaignRow[],
  walletById: null as WalletRow | null,
  walletRowsByUser: [] as WalletRow[],
  userCampaignCount: 0,
  insertedWallets: [] as InsertWalletParams[],
  insertedCampaigns: [] as InsertCampaignParams[],
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
  bumpGrantedCount: mock(
    async (_campaignId: string, _delta: number): Promise<void> => undefined,
  ),
};

export const voucherWalletRepoMocks = {
  findWalletRowById: mock(
    async (_walletId: string): Promise<WalletRow | null> =>
      voucherStubs.walletById,
  ),
  listWalletRowsByUser: mock(
    async (_userId: string, _limit?: number): Promise<WalletRow[]> =>
      voucherStubs.walletRowsByUser,
  ),
  countUserWalletsForCampaign: mock(
    async (_userId: string, _campaignId: string): Promise<number> =>
      voucherStubs.userCampaignCount,
  ),
  insertWallet: mock(async (params: InsertWalletParams): Promise<void> => {
    voucherStubs.insertedWallets.push(params);
  }),
  markWalletStatus: mock(
    async (params: {
      walletId: string;
      userId: string;
      campaignId: string | null;
      grantedAt: Date;
      status: string;
      usedAt: Date | null;
      usedOrderId: string | null;
      usedBookingId: string | null;
    }): Promise<void> => {
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
  voucherStubs.campaignRows = [];
  voucherStubs.walletById = null;
  voucherStubs.walletRowsByUser = [];
  voucherStubs.userCampaignCount = 0;
  voucherStubs.insertedWallets = [];
  voucherStubs.insertedCampaigns = [];
  voucherStubs.statusMarks = [];
  for (const fn of Object.values(voucherCampaignRepoMocks)) fn.mockClear();
  for (const fn of Object.values(voucherWalletRepoMocks)) fn.mockClear();
  for (const fn of Object.values(voucherRealtimeMocks)) fn.mockClear();
}
