// Realtime fan-out for voucher wallets. Campaign changes go public,
// wallet changes go to the owner inbox plus the staff operations board.
import { OPERATIONS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { promotionTopic } from "./voucher-realtime-topics";

export async function publishCampaignChange(campaignId: string): Promise<void> {
  await Promise.all([
    publishRealtimeEvent(promotionTopic(), {
      kind: "promotion-updated",
      campaignId,
    }),
    publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: "promotion-updated",
      campaignId,
    }),
  ]);
}

export async function publishWalletChange(params: {
  kind: "voucher-granted" | "voucher-used" | "voucher-revoked";
  walletId: string;
  userId: string;
}): Promise<void> {
  await Promise.all([
    publishRealtimeEvent(userTopic(params.userId), {
      kind: params.kind,
      walletId: params.walletId,
      userId: params.userId,
    }),
    publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: params.kind,
      walletId: params.walletId,
      userId: params.userId,
    }),
  ]);
}
