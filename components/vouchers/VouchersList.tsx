"use client";

import { HomePromoList } from "@/components/home/promotions/HomePromoList";
import { useMe } from "@/hooks/auth";
import { useVoucherGrantToast } from "@/hooks/useVoucherGrantToast";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useMyWallets, usePublicCampaigns } from "@/hooks/useVouchers";
import { VoucherGuestPanel } from "./VoucherGuestPanel";
import { VouchersFaq } from "./VouchersFaq";
import { VouchersIntro } from "./VouchersIntro";
import { WalletBento } from "./WalletBento";
import { WalletBoard } from "./WalletBoard";

// The /vouchers wallet. Owners see the chapter first — the best voucher as
// text, the counts beside it, the other vouchers as ruled rows — then the
// running promotions they do not own yet, the questions, and the paged
// archive. Guests and empty wallets see the running promotions first.
// Rendered by the route shell; page leaves stay metadata-only.
export function VouchersList() {
  const me = useMe();
  const ownerId = me.data?.id ?? null;
  useVoucherRealtime(ownerId ?? undefined, false);
  useVoucherGrantToast(ownerId);
  const authed = me.isSuccess && Boolean(me.data?.id);
  const guest = !me.isPending && !authed;
  // One wide wallet page supplies both the wallet block and the owned
  // campaign id set; WalletBoard keeps its own paged read for the archive.
  const wallets = useMyWallets(authed, { limit: 100 });
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
  const countText = guest
    ? "Chưa đăng nhập"
    : walletLoading
      ? "Đang tải ví…"
      : hasWallets
        ? `${items.length} voucher trong ví`
        : "Chưa có voucher trong ví";

  return (
    <div className="flex w-full flex-col">
      <VouchersIntro countText={countText} />
      {guest ? (
        <div className="w-full px-4 pt-8 sm:px-6 lg:px-10">
          <VoucherGuestPanel />
        </div>
      ) : null}
      {hasWallets || walletLoading ? (
        <div className="w-full px-4 pt-10 sm:px-6 md:pt-12 lg:px-10">
          {hasWallets ? (
            <WalletBento wallets={items} remainingOffers={remainingOffers} />
          ) : (
            <section
              aria-busy="true"
              aria-label="Đang tải ví voucher"
              className="h-32 rounded-lg bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900"
            />
          )}
        </div>
      ) : null}
      <div id="vouchers-con-lai" data-tour="vouchers-campaigns">
        <HomePromoList
          title={hasWallets ? "Ưu đãi bạn chưa có" : "Ưu đãi đang chạy"}
          excludeIds={ownedIds}
          showAll
        />
      </div>
      <div className="w-full px-4 pt-12 pb-16 sm:px-6 md:pt-16 lg:px-10">
        <VouchersFaq />
      </div>
      {authed ? (
        <div className="w-full px-4 pb-16 sm:px-6 lg:px-10">
          <WalletBoard />
        </div>
      ) : null}
    </div>
  );
}
