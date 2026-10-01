// Wallet refund for voided orders: a cancelled or refunded order
// returns its spent wallet so the customer can spend it again.
import { publishWalletChange } from "@/lib/vouchers/voucher-realtime";
import { restoreWalletForRef } from "@/lib/vouchers/voucher-spend.service";

export async function refundOrderWallet(params: {
  couponCode: string | null;
  customerId: string | null;
  orderId: string;
}): Promise<void> {
  if (!params.couponCode || !params.customerId) return;
  await restoreWalletForRef({
    walletId: params.couponCode,
    userId: params.customerId,
    orderId: params.orderId,
  });
  void publishWalletChange({
    kind: "voucher-granted",
    walletId: params.couponCode,
    userId: params.customerId,
  });
}
