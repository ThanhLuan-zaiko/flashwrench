// Pure offer ranking for the pickers: usable wallet vouchers ranked by
// saving, near-miss wallets that need a bigger subtotal, and claimable
// typed-code campaigns — plus the auto-pick and primary-offer rules the
// WalletPicker orchestrates. No I/O here.

import type { VoucherWallet } from "./voucher.types";
import type { ClaimableCodeCampaign } from "./voucher-code.types";
import { clampVoucherDiscount } from "./voucher-discount";
import type { VoucherKind } from "./voucher-pick";

export type RankedWallet = { wallet: VoucherWallet; discount: number };
export type NearWallet = {
  wallet: VoucherWallet;
  shortfall: number;
  discount: number; // discount at minOrder
};
export type RankedCode = {
  campaign: ClaimableCodeCampaign;
  discount: number;
  shortfall: number; // 0 = applicable now
};
export type PrimaryOffer =
  | { type: "wallet"; entry: RankedWallet; selected: boolean }
  | { type: "code"; entry: RankedCode }
  | { type: "near-wallet"; entry: NearWallet }
  | { type: "near-code"; entry: RankedCode }
  | null;

function discountOf(
  fields: {
    discountType: VoucherWallet["discountType"];
    discountValue: number;
    maxDiscount: number;
  },
  subtotal: number,
): number {
  return clampVoucherDiscount({
    discountType: fields.discountType,
    discountValue: fields.discountValue,
    maxDiscount: fields.maxDiscount,
    subtotal,
  });
}

// Eligible for the kind: live, spendable, in scope and unexpired. The
// subtotal does NOT gate this — usable vs near-miss split on minOrder.
function eligibleForKind(
  wallet: VoucherWallet,
  kind: VoucherKind,
  now: number,
): boolean {
  return (
    wallet.status === "active" &&
    wallet.spendable &&
    (wallet.scope === "all" || wallet.scope === kind) &&
    (!wallet.expiresAt || Date.parse(wallet.expiresAt) > now)
  );
}

function expiresAtKey(wallet: VoucherWallet): number {
  return wallet.expiresAt
    ? Date.parse(wallet.expiresAt)
    : Number.MAX_SAFE_INTEGER;
}

export function rankUsableWallets(
  wallets: readonly VoucherWallet[],
  kind: VoucherKind,
  subtotal: number,
  now = Date.now(),
): RankedWallet[] {
  return wallets
    .filter((wallet) => eligibleForKind(wallet, kind, now))
    .filter((wallet) => subtotal >= wallet.minOrder)
    .map((wallet) => ({ wallet, discount: discountOf(wallet, subtotal) }))
    .filter((entry) => entry.discount > 0)
    .sort(
      (a, b) =>
        b.discount - a.discount ||
        expiresAtKey(a.wallet) - expiresAtKey(b.wallet) ||
        a.wallet.campaignName.localeCompare(b.wallet.campaignName, "vi"),
    );
}

export function nearMissWallets(
  wallets: readonly VoucherWallet[],
  kind: VoucherKind,
  subtotal: number,
  now = Date.now(),
): NearWallet[] {
  return wallets
    .filter((wallet) => eligibleForKind(wallet, kind, now))
    .filter((wallet) => subtotal < wallet.minOrder)
    .map((wallet) => ({
      wallet,
      shortfall: wallet.minOrder - subtotal,
      discount: discountOf(wallet, wallet.minOrder),
    }))
    .filter((entry) => entry.discount > 0)
    .sort((a, b) => a.shortfall - b.shortfall || b.discount - a.discount);
}

export function rankClaimableCodes(
  codes: readonly ClaimableCodeCampaign[],
  subtotal: number,
): RankedCode[] {
  return codes
    .map((campaign) => {
      const applicable = subtotal >= campaign.minOrder;
      return {
        campaign,
        shortfall: applicable ? 0 : campaign.minOrder - subtotal,
        discount: discountOf(
          campaign,
          applicable ? subtotal : campaign.minOrder,
        ),
      };
    })
    .filter((entry) => entry.discount > 0)
    .sort(
      (a, b) =>
        a.shortfall - b.shortfall ||
        (a.shortfall === 0 ? b.discount - a.discount : 0),
    );
}

// Auto-apply transition: returns the id to select, null to clear a stale
// auto pick, or undefined to leave the selection alone. A manual pick is
// never overridden; opting out stops auto-apply for the panel's life.
export function nextAutoSelection(input: {
  value: string | null;
  autoAppliedId: string | null;
  optedOut: boolean;
  usableIds: readonly string[];
}): string | null | undefined {
  if (input.optedOut) return undefined;
  const best = input.usableIds[0] ?? null;
  if (input.value === null) return best ?? undefined;
  if (input.value === input.autoAppliedId && input.value !== best) {
    return best;
  }
  return undefined;
}

// One primary ticket for the collapsed picker: the customer's own
// selection first, then the best usable wallet, then the best applicable
// code, then the nearest near-miss (wallet wins ties).
export function pickPrimaryOffer(input: {
  usable: RankedWallet[];
  near: NearWallet[];
  codes: RankedCode[];
  value: string | null;
}): PrimaryOffer {
  const selectedUsable = input.usable.find(
    (entry) => entry.wallet.id === input.value,
  );
  if (selectedUsable) {
    return { type: "wallet", entry: selectedUsable, selected: true };
  }
  const bestWallet = input.usable[0];
  if (bestWallet) return { type: "wallet", entry: bestWallet, selected: false };
  const bestCode = input.codes.find((entry) => entry.shortfall === 0);
  if (bestCode) return { type: "code", entry: bestCode };
  const nearWallet = input.near[0];
  const nearCode = input.codes.find((entry) => entry.shortfall > 0);
  if (nearWallet && (!nearCode || nearWallet.shortfall <= nearCode.shortfall)) {
    return { type: "near-wallet", entry: nearWallet };
  }
  if (nearCode) return { type: "near-code", entry: nearCode };
  return null;
}
