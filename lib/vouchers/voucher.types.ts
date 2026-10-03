// Shared voucher wallet shapes. Wallets are account-bound: each row
// belongs to exactly one user_id, so codes are never shared.
export type VoucherDiscountType = "percent" | "fixed" | "free_service";
export type VoucherScope = "order" | "booking" | "all";
export type WalletStatus = "active" | "used" | "expired" | "revoked";

export type VoucherCampaign = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  images: string[];
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
  isDeleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

// Public advertising payload: the customer-facing subset of a campaign.
// Staff-only fields (code, grant limits, lifecycle flags, timestamps)
// never leave the server on public endpoints.
export type PublicVoucherCampaign = Pick<
  VoucherCampaign,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "imageUrl"
  | "images"
  | "discountType"
  | "discountValue"
  | "maxDiscount"
  | "minOrder"
  | "scope"
  | "startAt"
  | "endAt"
  | "totalLimit"
  | "grantedCount"
>;

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
  slug: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
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
  is_deleted: boolean | null;
  deleted_at: Date | null;
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
    | "slug"
    | "name"
    | "description"
    | "imageUrl"
    | "images"
    | "imageAssetIds"
    | "confirm"
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

// Owner detail payload: the wallet plus its campaign for full context
// (description, gallery, time window). Campaign may be gone (null) when
// the row was hard-deleted after the grant.
export type WalletDetail = {
  wallet: VoucherWallet;
  campaign: VoucherCampaign | null;
};

export function isDeletedFlag(value: boolean | null): boolean {
  return value === true;
}

// The human input is the slug; the voucher code is derived from it
// server-side (dashes -> underscores, uppercased) and never typed by hand.
// The gallery mirrors the catalog contract: images[] are stored media
// urls, imageAssetIds are the fresh uploads to claim on save.
export type CreateCampaignInput = {
  slug: string;
  name: string;
  description?: string;
  images?: string[];
  imageAssetIds?: string[];
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
