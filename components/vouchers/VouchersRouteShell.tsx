"use client";

import { useParams } from "next/navigation";
import { CampaignDetail } from "@/components/promotions/CampaignDetail";
import { VouchersList } from "./VouchersList";
import { WalletDetail } from "./WalletDetail";

// The wallet and campaign detail screens keep the centred reading column; the
// wallet list is full width like the products shop.
const DETAIL_CONTAINER =
  "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6";

function singleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// Mounted once by the /vouchers layout. The detail segments decide which
// screen renders: a wallet id shows the owned voucher, a slug shows the
// public campaign, otherwise the wallet list renders.
// Page leaves stay metadata-only and the wallet pager keeps its own state.
export function VouchersRouteShell() {
  const params = useParams();
  const walletId = singleParam(
    params.walletId as string | string[] | undefined,
  );
  const slug = singleParam(params.slug as string | string[] | undefined);
  if (walletId) {
    return (
      <div className={DETAIL_CONTAINER}>
        <WalletDetail walletId={walletId} />
      </div>
    );
  }
  if (slug) {
    return (
      <div className={DETAIL_CONTAINER}>
        <CampaignDetail slug={slug} />
      </div>
    );
  }
  return <VouchersList />;
}
