"use client";

import { PromoBannerSection } from "@/components/promotions/PromoBannerSection";
import { WalletBoard } from "@/components/vouchers/WalletBoard";

// The /vouchers shelf: running promotions on top, the owned wallet below.
// Rendered by the route shell; page leaves stay metadata-only.
export function VouchersList() {
  return (
    <>
      <header>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Ví voucher của tôi
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Mỗi voucher chỉ dùng được trên tài khoản này, tự cập nhật khi có
          voucher mới.
        </p>
      </header>
      <PromoBannerSection
        title="Ưu đãi đang chạy"
        subtitle="Các chương trình còn suất — bấm xem chi tiết rồi tạo tài khoản để được phát khi đủ điều kiện."
        maxItems={4}
      />
      <WalletBoard />
    </>
  );
}
