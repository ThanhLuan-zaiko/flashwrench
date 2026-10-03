// Fetch layer for voucher wallets. Components never call fetch directly.

import type {
  CreateAutoRuleInput,
  NearMilestoneEntry,
  VoucherAutoRule,
} from "@/lib/vouchers/auto-rule.types";
import type {
  CreateCampaignInput,
  PublicVoucherCampaign,
  VoucherCampaign,
  VoucherWallet,
  WalletDetail,
} from "@/lib/vouchers/voucher.types";
import { AuthApiError } from "./auth.api";

async function readErrors(response: Response): Promise<Record<string, string>> {
  try {
    const body = (await response.json()) as { errors?: Record<string, string> };
    return body.errors ?? { form: "Có lỗi xảy ra. Vui lòng thử lại." };
  } catch {
    return { form: "Có lỗi xảy ra. Vui lòng thử lại." };
  }
}

export async function fetchAdminCampaigns(): Promise<VoucherCampaign[]> {
  const response = await fetch("/api/admin/voucher-campaigns", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được chiến dịch.");
  const body = (await response.json()) as { campaigns: VoucherCampaign[] };
  return body.campaigns;
}

export async function createAdminCampaign(
  input: CreateCampaignInput,
): Promise<VoucherCampaign> {
  const response = await fetch("/api/admin/voucher-campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new AuthApiError(response.status, await readErrors(response));
  }
  const body = (await response.json()) as { campaign: VoucherCampaign };
  return body.campaign;
}

export async function updateAdminCampaign(
  campaignId: string,
  input: CreateCampaignInput,
): Promise<VoucherCampaign> {
  const response = await fetch(`/api/admin/voucher-campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new AuthApiError(response.status, await readErrors(response));
  }
  const body = (await response.json()) as { campaign: VoucherCampaign };
  return body.campaign;
}

export async function toggleAdminCampaign(
  campaignId: string,
  isActive: boolean,
): Promise<VoucherCampaign> {
  const response = await fetch(`/api/admin/voucher-campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "toggle", isActive }),
  });
  if (!response.ok) {
    throw new AuthApiError(response.status, await readErrors(response));
  }
  const body = (await response.json()) as { campaign: VoucherCampaign };
  return body.campaign;
}

async function patchCampaignLifecycle(
  campaignId: string,
  action: "soft-delete" | "restore",
): Promise<VoucherCampaign> {
  const response = await fetch(`/api/admin/voucher-campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    throw new AuthApiError(response.status, await readErrors(response));
  }
  const body = (await response.json()) as { campaign: VoucherCampaign };
  return body.campaign;
}

export async function softDeleteAdminCampaign(
  campaignId: string,
): Promise<VoucherCampaign> {
  return patchCampaignLifecycle(campaignId, "soft-delete");
}

export async function restoreAdminCampaign(
  campaignId: string,
): Promise<VoucherCampaign> {
  return patchCampaignLifecycle(campaignId, "restore");
}

export async function hardDeleteAdminCampaign(
  campaignId: string,
  confirm: string,
): Promise<void> {
  const response = await fetch(`/api/admin/voucher-campaigns/${campaignId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ confirm }),
  });
  if (!response.ok) {
    throw new AuthApiError(response.status, await readErrors(response));
  }
}

export async function fetchDispatchCampaigns(): Promise<VoucherCampaign[]> {
  const response = await fetch("/api/dispatch/voucher-campaigns", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được chiến dịch.");
  const body = (await response.json()) as { campaigns: VoucherCampaign[] };
  return body.campaigns;
}

export async function grantDispatchWallet(input: {
  campaignId: string;
  userId: string;
  note?: string;
}): Promise<VoucherWallet> {
  const response = await fetch("/api/dispatch/vouchers/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không phát được voucher.");
  }
  const body = (await response.json()) as { wallet: VoucherWallet };
  return body.wallet;
}

export async function revokeDispatchWallet(
  walletId: string,
  note?: string,
): Promise<VoucherWallet> {
  const response = await fetch(`/api/dispatch/vouchers/${walletId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note: note ?? "" }),
  });
  if (!response.ok) throw new Error("Không thu hồi được voucher.");
  const body = (await response.json()) as { wallet: VoucherWallet };
  return body.wallet;
}

export async function fetchAutoRules(): Promise<VoucherAutoRule[]> {
  const response = await fetch("/api/dispatch/voucher-rules", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được quy tắc tự động.");
  const body = (await response.json()) as { rules: VoucherAutoRule[] };
  return body.rules;
}

export async function createAutoRule(
  input: CreateAutoRuleInput,
): Promise<VoucherAutoRule> {
  const response = await fetch("/api/dispatch/voucher-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không tạo được quy tắc.");
  }
  const body = (await response.json()) as { rule: VoucherAutoRule };
  return body.rule;
}

export async function toggleAutoRule(
  ruleId: string,
  isActive: boolean,
): Promise<VoucherAutoRule> {
  const response = await fetch(`/api/dispatch/voucher-rules/${ruleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không đổi được trạng thái quy tắc.");
  }
  const body = (await response.json()) as { rule: VoucherAutoRule };
  return body.rule;
}

export type VoucherProgress = {
  entries: NearMilestoneEntry[];
  scannedCustomers: number;
  truncated: boolean;
};

export async function fetchVoucherProgress(): Promise<VoucherProgress> {
  const response = await fetch("/api/dispatch/voucher-progress", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được tiến độ khách hàng.");
  return (await response.json()) as VoucherProgress;
}

export type MyWalletPage = {
  items: VoucherWallet[];
  nextCursor: string | null;
};

export async function fetchPublicCampaigns(): Promise<PublicVoucherCampaign[]> {
  const response = await fetch("/api/voucher-campaigns/public");
  if (!response.ok) throw new Error("Không tải được ưu đãi.");
  const body = (await response.json()) as {
    campaigns: PublicVoucherCampaign[];
  };
  return body.campaigns;
}

export async function fetchPublicCampaignBySlug(
  slug: string,
): Promise<PublicVoucherCampaign> {
  const response = await fetch(
    `/api/voucher-campaigns/public/${encodeURIComponent(slug)}`,
  );
  if (!response.ok) throw new Error("Ưu đãi không tồn tại hoặc đã kết thúc.");
  const body = (await response.json()) as { campaign: PublicVoucherCampaign };
  return body.campaign;
}

export async function fetchMyWalletDetail(
  walletId: string,
): Promise<WalletDetail> {
  const response = await fetch(
    `/api/vouchers/${encodeURIComponent(walletId)}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Không tải được voucher.");
  return (await response.json()) as WalletDetail;
}

export type MyVoucherStats = {
  bookings: number;
  orders: number;
  spent: number;
  lastActivityAt: string | null;
};

export async function fetchMyVoucherStats(): Promise<MyVoucherStats> {
  const response = await fetch("/api/vouchers/progress", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được tiến độ ưu đãi.");
  return (await response.json()) as MyVoucherStats;
}

export async function fetchMyWallets(params: {
  cursor?: string | null;
  limit?: number;
}): Promise<MyWalletPage> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  const response = await fetch(`/api/vouchers/mine${suffix}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được ví voucher.");
  return (await response.json()) as MyWalletPage;
}
