"use client";

import { useParams } from "next/navigation";
import { CampaignDetail } from "@/components/promotions/CampaignDetail";
import { VouchersList } from "./VouchersList";
import { WalletDetail } from "./WalletDetail";

function singleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// Mounted once by the /vouchers layout. The detail segments decide which
// screen renders: a wallet id shows the owned voucher, a slug shows the
// public campaign, otherwise the shelf (promotions plus wallet) renders.
// Page leaves stay metadata-only and the wallet pager keeps its own state.
export function VouchersRouteShell() {
  const params = useParams();
  const walletId = singleParam(
    params.walletId as string | string[] | undefined,
  );
  const slug = singleParam(params.slug as string | string[] | undefined);
  if (walletId) return <WalletDetail walletId={walletId} />;
  if (slug) return <CampaignDetail slug={slug} />;
  return <VouchersList />;
}
