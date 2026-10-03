// Row -> API shape mapping for voucher campaigns and wallets.
import type {
  CampaignRow,
  PublicVoucherCampaign,
  VoucherCampaign,
  VoucherDiscountType,
  VoucherScope,
  VoucherWallet,
  WalletRow,
  WalletStatus,
} from "./voucher.types";

function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

function toDiscountType(value: string | null): VoucherDiscountType {
  if (value === "percent" || value === "fixed" || value === "free_service") {
    return value;
  }
  return "fixed";
}

function toScope(value: string | null): VoucherScope {
  if (value === "order" || value === "booking" || value === "all") return value;
  return "all";
}

function toStatus(value: string | null): WalletStatus {
  if (value === "used" || value === "expired" || value === "revoked") {
    return value;
  }
  return "active";
}

export function toCampaign(row: CampaignRow): VoucherCampaign {
  // Gallery first; pre-migration rows may only carry the legacy single
  // image_url, which then doubles as images[0].
  const images = row.images?.length
    ? row.images
    : row.image_url
      ? [row.image_url]
      : [];
  return {
    id: row.campaign_id,
    code: row.code ?? "",
    slug: row.slug ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
    imageUrl: images[0] ?? row.image_url ?? "",
    images,
    discountType: toDiscountType(row.discount_type),
    discountValue: row.discount_value ?? 0,
    maxDiscount: row.max_discount ?? 0,
    minOrder: row.min_order ?? 0,
    scope: toScope(row.scope),
    startAt: toIso(row.start_at),
    endAt: toIso(row.end_at),
    totalLimit: row.total_limit ?? 0,
    grantedCount: row.granted_count ?? 0,
    perUserLimit: row.per_user_limit ?? 1,
    allowDispatcherGrant: row.allow_dispatcher_grant ?? false,
    dispatcherMaxValue: row.dispatcher_max_value ?? 0,
    isActive: row.is_active ?? false,
    isDeleted: row.is_deleted === true,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: toIso(row.deleted_at),
  };
}

// Advertising feed: only fields a guest needs to read a promotion.
// Internal staff fields (code, grant caps, lifecycle flags) stay
// server-side so public endpoints never leak operations detail.
export function toPublicCampaign(row: CampaignRow): PublicVoucherCampaign {
  const campaign = toCampaign(row);
  return {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    description: campaign.description,
    imageUrl: campaign.imageUrl,
    images: campaign.images,
    discountType: campaign.discountType,
    discountValue: campaign.discountValue,
    maxDiscount: campaign.maxDiscount,
    minOrder: campaign.minOrder,
    scope: campaign.scope,
    startAt: campaign.startAt,
    endAt: campaign.endAt,
    totalLimit: campaign.totalLimit,
    grantedCount: campaign.grantedCount,
  };
}

export function toWallet(
  row: WalletRow,
  campaign?: {
    scope: string | null;
    min_order: number | null;
  } | null,
): VoucherWallet {
  return {
    id: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id ?? "",
    campaignCode: row.campaign_code ?? "",
    campaignName: row.campaign_name ?? "",
    imageUrl: row.image_url ?? "",
    discountType: toDiscountType(row.discount_type),
    discountValue: row.discount_value ?? 0,
    maxDiscount: row.max_discount ?? 0,
    scope: toScope(campaign?.scope ?? null),
    minOrder: campaign?.min_order ?? 0,
    status: toStatus(row.status),
    grantedAt: toIso(row.granted_at),
    expiresAt: toIso(row.expires_at),
    usedAt: toIso(row.used_at),
    usedOrderId: row.used_order_id,
    usedBookingId: row.used_booking_id,
  };
}
