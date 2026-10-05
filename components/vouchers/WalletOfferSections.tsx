"use client";

import { useId } from "react";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { clampVoucherDiscount } from "@/lib/vouchers/voucher-discount";
import type {
  NearWallet,
  RankedCode,
  RankedWallet,
} from "@/lib/vouchers/voucher-offers";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";
import { ticketDiscountText } from "@/lib/vouchers/voucher-pick";
import { ClaimOfferButton } from "./ClaimOfferButton";
import { VoucherOfferTicket } from "./VoucherOfferTicket";
import { codeMeta, codeTitle, walletMeta } from "./voucher-offer-format";
import { WalletOfferAction } from "./WalletOfferAction";

const SECTION_LABEL = "text-xs font-semibold text-zinc-500 dark:text-zinc-400";

function walletLabel(wallet: VoucherWallet, subtotal: number): string {
  const discount = clampVoucherDiscount({
    discountType: wallet.discountType,
    discountValue: wallet.discountValue,
    maxDiscount: wallet.maxDiscount,
    subtotal,
  });
  return `${wallet.campaignName} — ${ticketDiscountText(wallet, discount)}`;
}

// The expanded offer sections behind "Xem thêm ưu đãi": other usable
// wallets, near-misses and claimable codes, all excluding the primary
// ticket the caller already rendered. Claimable codes render in full —
// the server already caps them at 10.
export function WalletOfferSections({
  kind,
  subtotal,
  usable,
  near,
  codes,
  value,
  disabled,
  onSelect,
  onRemove,
  onClaimed,
}: {
  kind: VoucherKind;
  subtotal: number;
  usable: RankedWallet[];
  near: NearWallet[];
  codes: RankedCode[];
  value: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onRemove: () => void;
  onClaimed: (wallet: VoucherWallet) => void;
}) {
  const labelId = useId();
  const visibleUsable = usable.slice(0, 4);
  const overflow = usable.slice(4);
  const overflowLabelId = `${labelId}-overflow`;
  return (
    <div className="flex flex-col gap-3">
      {usable.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={SECTION_LABEL}>Voucher khác trong ví</p>
          {visibleUsable.map(({ wallet, discount }) => (
            <VoucherOfferTicket
              key={wallet.id}
              title={ticketDiscountText(wallet, discount)}
              name={wallet.campaignName}
              meta={walletMeta(wallet)}
              selected={wallet.id === value}
              badge={wallet.id === value ? "Đang dùng" : undefined}
              action={
                <WalletOfferAction
                  wallet={wallet}
                  selected={wallet.id === value}
                  disabled={disabled}
                  onSelect={onSelect}
                  onRemove={onRemove}
                />
              }
            />
          ))}
          {overflow.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span id={overflowLabelId} className={SECTION_LABEL}>
                Voucher khác ({overflow.length})
              </span>
              <DropdownSelect
                id={`${overflowLabelId}-select`}
                labelId={overflowLabelId}
                value=""
                onChange={(next) => {
                  if (next) onSelect(next);
                }}
                options={overflow.map(({ wallet }) => ({
                  value: wallet.id,
                  label: walletLabel(wallet, subtotal),
                  hint:
                    wallet.minOrder > 0
                      ? `Đơn từ ${formatVnd(wallet.minOrder)}`
                      : "Không yêu cầu giá trị tối thiểu",
                }))}
                placeholder="Chọn voucher khác…"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}
      {near.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={SECTION_LABEL}>Sắp dùng được</p>
          {near.slice(0, 3).map(({ wallet, shortfall, discount }) => (
            <VoucherOfferTicket
              key={wallet.id}
              muted
              title={ticketDiscountText(wallet, discount)}
              name={wallet.campaignName}
              meta={walletMeta(wallet)}
              footer={`Thêm ${formatVnd(shortfall)} để dùng`}
            />
          ))}
          {near.length > 3 && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Còn {near.length - 3} voucher khác cần thêm tiền.
            </p>
          )}
        </div>
      )}
      {codes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={SECTION_LABEL}>Mã có thể nhận</p>
          {codes.map(({ campaign, discount, shortfall }) => (
            <VoucherOfferTicket
              key={campaign.campaignId}
              muted={shortfall > 0}
              title={codeTitle(campaign.discountType, discount)}
              name={campaign.name}
              meta={codeMeta(campaign)}
              action={
                shortfall === 0 ? (
                  <ClaimOfferButton
                    code={campaign.code}
                    kind={kind}
                    subtotal={subtotal}
                    campaignName={campaign.name}
                    disabled={disabled}
                    onClaimed={onClaimed}
                  />
                ) : undefined
              }
              footer={
                shortfall > 0
                  ? `Thêm ${formatVnd(shortfall)} để dùng`
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
