import type { Metadata } from "next";
import { VoucherDetailColumn } from "@/components/vouchers/VoucherDetailColumn";
import { WalletDetail } from "@/components/vouchers/WalletDetail";

export const metadata: Metadata = {
  title: "Chi tiết voucher | FlashWrench",
  description: "Toàn bộ thông tin về voucher gắn với tài khoản của bạn.",
};

type DetailParams = { params: Promise<{ walletId: string }> };

export default async function VoucherWalletDetailPage({
  params,
}: DetailParams) {
  const { walletId } = await params;
  return (
    <VoucherDetailColumn>
      <WalletDetail walletId={walletId} />
    </VoucherDetailColumn>
  );
}
