// Typed redeem-code claim shapes: a signed-in customer types a code and
// the server binds one campaign wallet to their account.

import type { VoucherDiscountType, VoucherWallet } from "./voucher.types";
import type { VoucherKind } from "./voucher-pick";

export type ClaimVoucherCodeInput = {
  code: string;
  kind: VoucherKind;
  subtotal: number;
};

export type ClaimVoucherCodeResult = {
  wallet: VoucherWallet;
  discount: number;
  reused: boolean;
};

// What the public campaign page may show one signed-in customer.
export type RedeemCodeVisibility =
  | { status: "claimable"; code: string }
  | { status: "owned"; walletId: string }
  | { status: "limit" };

// An eligible redeem-code campaign this customer could claim right now.
export type ClaimableCodeCampaign = {
  campaignId: string;
  slug: string;
  name: string;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
  minOrder: number;
  endAt: string | null;
};
