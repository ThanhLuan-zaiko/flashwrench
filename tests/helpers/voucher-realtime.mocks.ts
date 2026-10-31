import { mock } from "bun:test";

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
