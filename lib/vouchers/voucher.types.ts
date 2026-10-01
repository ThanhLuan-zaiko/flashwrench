// Shared voucher wallet shapes. Wallets are account-bound: each row
// belongs to exactly one user_id, so codes are never shared.
export type VoucherDiscountType = "percent" | "fixed" | "free_service";
export type VoucherScope = "order" | "booking" | "all";
export type WalletStatus = "active" | "used" | "expired" | "revoked";

export type VoucherCampaign = {
  id: string;
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
  minOrder: number;
  scope: VoucherScope;
  startAt: string | null;
  endAt: string | null;
  totalLimit: number;
  grantedCount: number;
  perUserLimit: number;
  allowDispatcherGrant: boolean;
  dispatcherMaxValue: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VoucherWallet = {
  id: string;
  userId: string;
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  imageUrl: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
  // Eligibility snapshot for pickers: the wallet row itself carries the
  // money fields, the campaign contributes scope + minimum order.
  scope: VoucherScope;
  minOrder: number;
  status: WalletStatus;
  grantedAt: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  usedOrderId: string | null;
  usedBookingId: string | null;
};

export type CampaignRow = {
  campaign_id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  discount_type: string | null;
  discount_value: number | null;
  max_discount: number | null;
  min_order: number | null;
  scope: string | null;
  start_at: Date | null;
  end_at: Date | null;
  total_limit: number | null;
  granted_count: number | null;
  per_user_limit: number | null;
  allow_dispatcher_grant: boolean | null;
  dispatcher_max_value: number | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type WalletRow = {
  wallet_id: string;
  user_id: string;
  campaign_id: string | null;
  campaign_code: string | null;
  campaign_name: string | null;
  image_url: string | null;
  discount_type: string | null;
  discount_value: number | null;
  max_discount: number | null;
  status: string | null;
  granted_by: string | null;
  grant_note: string | null;
  granted_at: Date | null;
  expires_at: Date | null;
  used_at: Date | null;
  used_order_id: string | null;
  used_booking_id: string | null;
};

export type WalletUserIndexRow = {
  user_id: string;
  granted_at: Date | null;
  wallet_id: string;
  campaign_id: string | null;
  status: string | null;
};

export type VoucherFieldErrors = Partial<
  Record<
    | "code"
    | "name"
    | "description"
    | "imageUrl"
    | "discountType"
    | "discountValue"
    | "maxDiscount"
    | "minOrder"
    | "scope"
    | "startAt"
    | "endAt"
    | "totalLimit"
    | "perUserLimit"
    | "allowDispatcherGrant"
    | "dispatcherMaxValue"
    | "isActive"
    | "userId"
    | "campaignId"
    | "walletId"
    | "note"
    | "orderId"
    | "bookingId"
    | "form",
    string
  >
>;

export type VoucherResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: VoucherFieldErrors };

export type CreateCampaignInput = {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  imageAssetId?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrder?: number;
  scope?: VoucherScope;
  startAt?: string;
  endAt?: string;
  totalLimit?: number;
  perUserLimit?: number;
  allowDispatcherGrant?: boolean;
  dispatcherMaxValue?: number;
  isActive?: boolean;
};

export type UpdateCampaignInput = CreateCampaignInput;

export type GrantWalletInput = {
  campaignId: string;
  userId: string;
  note?: string;
  expiresAt?: string;
};
