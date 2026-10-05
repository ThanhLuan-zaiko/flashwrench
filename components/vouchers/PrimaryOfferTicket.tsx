"use client";

import { FiCheckCircle } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { PrimaryOffer } from "@/lib/vouchers/voucher-offers";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";
import { ticketDiscountText } from "@/lib/vouchers/voucher-pick";
import { ClaimOfferButton } from "./ClaimOfferButton";
import { VoucherOfferTicket } from "./VoucherOfferTicket";
import { codeMeta, codeTitle, walletMeta } from "./voucher-offer-format";
import { WalletOfferAction } from "./WalletOfferAction";

// The one always-visible offer: the selected or best usable wallet,
// a claimable code, or the nearest near-miss.
export function PrimaryOfferTicket({
  primary,
  kind,
  subtotal,
  bestWalletId,
  autoApplied,
  disabled,
  onSelect,
  onRemove,
  onClaimed,
}: {
  primary: NonNullable<PrimaryOffer>;
  kind: VoucherKind;
  subtotal: number;
  bestWalletId: string | undefined;
  autoApplied: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onRemove: () => void;
  onClaimed: (wallet: VoucherWallet) => void;
}) {
  if (primary.type === "wallet") {
    const { wallet, discount } = primary.entry;
    return (
      <VoucherOfferTicket
        title={ticketDiscountText(wallet, discount)}
        name={wallet.campaignName}
        meta={walletMeta(wallet)}
        selected={primary.selected}
        badge={
          primary.selected
            ? "Đang dùng"
            : bestWalletId === wallet.id
              ? "Tiết kiệm nhất"
              : undefined
        }
        action={
          <WalletOfferAction
            wallet={wallet}
            selected={primary.selected}
            disabled={disabled}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        }
        footer={
          autoApplied && primary.selected ? (
            <span className="inline-flex items-center gap-1">
              <FiCheckCircle aria-hidden="true" className="h-3.5 w-3.5" />
              Đã tự áp voucher tiết kiệm nhất.
            </span>
          ) : undefined
        }
      />
    );
  }
  if (primary.type === "code") {
    const { campaign, discount } = primary.entry;
    return (
      <VoucherOfferTicket
        title={codeTitle(campaign.discountType, discount)}
        name={campaign.name}
        meta={codeMeta(campaign)}
        action={
          <ClaimOfferButton
            code={campaign.code}
            kind={kind}
            subtotal={subtotal}
            campaignName={campaign.name}
            disabled={disabled}
            onClaimed={onClaimed}
          />
        }
      />
    );
  }
  const mutedMeta =
    primary.type === "near-wallet"
      ? walletMeta(primary.entry.wallet)
      : codeMeta(primary.entry.campaign);
  const mutedTitle =
    primary.type === "near-wallet"
      ? ticketDiscountText(primary.entry.wallet, primary.entry.discount)
      : codeTitle(primary.entry.campaign.discountType, primary.entry.discount);
  const mutedName =
    primary.type === "near-wallet"
      ? primary.entry.wallet.campaignName
      : primary.entry.campaign.name;
  return (
    <VoucherOfferTicket
      muted
      title={mutedTitle}
      name={mutedName}
      meta={mutedMeta}
      footer={`Thêm ${formatVnd(primary.entry.shortfall)} để dùng`}
    />
  );
}
