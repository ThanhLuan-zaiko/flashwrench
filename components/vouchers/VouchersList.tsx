"use client";

import { PromoBannerSection } from "@/components/promotions/PromoBannerSection";
import { PromoCampaignGrid } from "@/components/promotions/PromoCampaignGrid";
import { useMe } from "@/hooks/auth";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useVoucherGrantToast } from "@/hooks/useVoucherGrantToast";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import {
  useMyVoucherStats,
  useMyWallets,
  usePublicCampaigns,
} from "@/hooks/useVouchers";
import { WalletBento } from "./WalletBento";
import { WalletBoard } from "./WalletBoard";

// The /vouchers shelf. Owners get the bento wallet first — hero ticket,
// stat tiles, mini tiles — then only promotions they do NOT own yet.
// Guests and empty wallets see the running promotions first instead.
// Rendered by the route shell; page leaves stay metadata-only.
export function VouchersList() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const me = useMe();
  const ownerId = me.data?.id ?? null;
  useVoucherRealtime(ownerId ?? undefined, false);
  useVoucherGrantToast(ownerId);
  const authed = me.isSuccess && Boolean(me.data?.id);
  // One wide wallet page supplies both the bento block and the owned
  // campaign id set; WalletBoard keeps its own paged read for the archive.
  const wallets = useMyWallets(authed, { limit: 100 });
  const stats = useMyVoucherStats(authed);
  const campaigns = usePublicCampaigns(true);

  const items = wallets.data?.items ?? [];
  const ownedIds = new Set(
    items
      .map((wallet) => wallet.campaignId)
      .filter((id): id is string => Boolean(id)),
  );
  const hasWallets = wallets.isSuccess && items.length > 0;
  const walletLoading = authed && wallets.isPending;
  const remainingOffers = (campaigns.data ?? []).filter(
    (campaign) => !ownedIds.has(campaign.id),
  ).length;

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Ví voucher của tôi
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Mỗi voucher chỉ dùng được trên tài khoản này, tự cập nhật khi có
          voucher mới.
        </p>
      </header>
      {hasWallets ? (
        <WalletBento wallets={items} remainingOffers={remainingOffers} />
      ) : walletLoading ? (
        <section
          aria-label="Đang tải ví voucher"
          aria-busy="true"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4"
        >
          <div className="h-64 rounded-2xl border border-zinc-200 bg-zinc-100 motion-safe:animate-pulse sm:col-span-2 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-28 rounded-2xl border border-zinc-200 bg-zinc-100 motion-safe:animate-pulse dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-28 rounded-2xl border border-zinc-200 bg-zinc-100 motion-safe:animate-pulse dark:border-zinc-800 dark:bg-zinc-900" />
        </section>
      ) : null}
      <PromoBannerSection
        title={hasWallets ? "Ưu đãi bạn chưa có" : "Ưu đãi đang chạy"}
        subtitle={
          hasWallets
            ? "Các chương trình còn suất mà tài khoản bạn chưa sở hữu."
            : "Các chương trình còn suất — bấm xem chi tiết rồi tạo tài khoản để được phát khi đủ điều kiện."
        }
        excludeIds={ownedIds}
      />
      <PromoCampaignGrid
        title={hasWallets ? "Cách nhận ưu đãi" : "Tất cả ưu đãi đang chạy"}
        anchorId="vouchers-con-lai"
        excludeIds={ownedIds}
        ghost
        stats={stats.data ?? null}
      />
      <WalletBoard />
    </div>
  );
}
