// Fetch layer for voucher wallets. Components never call fetch directly.
import type {
  CreateCampaignInput,
  VoucherCampaign,
  VoucherWallet,
} from "@/lib/vouchers/voucher.types";

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
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không tạo được chiến dịch.");
  }
  const body = (await response.json()) as { campaign: VoucherCampaign };
  return body.campaign;
}

export async function toggleAdminCampaign(
  campaignId: string,
  isActive: boolean,
  code: string,
): Promise<VoucherCampaign> {
  const response = await fetch(`/api/admin/voucher-campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "toggle", isActive, code }),
  });
  if (!response.ok) throw new Error("Không đổi được trạng thái.");
  const body = (await response.json()) as { campaign: VoucherCampaign };
  return body.campaign;
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

export async function fetchMyWallets(): Promise<VoucherWallet[]> {
  const response = await fetch("/api/vouchers/mine", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Không tải được ví voucher.");
  const body = (await response.json()) as { wallets: VoucherWallet[] };
  return body.wallets;
}

export async function uploadPromotionImage(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("scope", "promotion");
  form.set("ownerType", "promotion");
  form.set("ownerId", "pending");
  const response = await fetch("/api/media", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!response.ok) throw new Error("Không tải được ảnh bìa.");
  const body = (await response.json()) as {
    asset: { url: string; assetId: string };
  };
  return `${body.asset.url}|${body.asset.assetId}`;
}
