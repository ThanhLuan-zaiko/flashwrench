"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCampaignInput } from "@/lib/vouchers/voucher.types";
import {
  createAdminCampaign,
  createAutoRule,
  fetchAdminCampaigns,
  fetchAutoRules,
  fetchDispatchCampaigns,
  fetchMyVoucherStats,
  fetchMyWalletDetail,
  fetchMyWallets,
  fetchPublicCampaignBySlug,
  fetchPublicCampaigns,
  fetchVoucherProgress,
  grantDispatchWallet,
  hardDeleteAdminCampaign,
  restoreAdminCampaign,
  revokeDispatchWallet,
  softDeleteAdminCampaign,
  toggleAdminCampaign,
  toggleAutoRule,
  updateAdminCampaign,
  updateCampaignRedeemCode,
} from "@/services/vouchers.api";

export const voucherKeys = {
  admin: ["vouchers", "admin-campaigns"] as const,
  dispatch: ["vouchers", "dispatch-campaigns"] as const,
  public: ["vouchers", "public-campaigns"] as const,
  mine: ["vouchers", "mine"] as const,
  myStats: ["vouchers", "my-stats"] as const,
  rules: ["vouchers", "auto-rules"] as const,
  progress: ["vouchers", "auto-progress"] as const,
  walletDetail: (walletId: string) =>
    ["vouchers", "wallet-detail", walletId] as const,
  publicCampaign: (slug: string) =>
    ["vouchers", "public-campaign", slug] as const,
  campaignCode: (slug: string) => ["vouchers", "campaign-code", slug] as const,
  claimable: (kind: string) => ["vouchers", "claimable", kind] as const,
};

export function usePublicCampaign(slug: string, enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.publicCampaign(slug)],
    queryFn: () => fetchPublicCampaignBySlug(slug),
    enabled: enabled && slug.trim().length > 0,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMyWalletDetail(walletId: string, enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.walletDetail(walletId)],
    queryFn: () => fetchMyWalletDetail(walletId),
    enabled: enabled && walletId.trim().length > 0,
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function usePublicCampaigns(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.public],
    queryFn: fetchPublicCampaigns,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminCampaigns(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.admin],
    queryFn: fetchAdminCampaigns,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useDispatchCampaigns(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.dispatch],
    queryFn: fetchDispatchCampaigns,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMyWallets(
  enabled = true,
  params: { cursor?: string | null; limit?: number } = {},
) {
  const cursor = params.cursor ?? null;
  const limit = params.limit ?? null;
  return useQuery({
    queryKey: [...voucherKeys.mine, cursor, limit],
    queryFn: () => fetchMyWallets({ cursor, limit: limit ?? undefined }),
    enabled,
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// The "almost there" counters behind earn-progress bars on /vouchers.
// Off for guests — the endpoint is auth-only.
export function useMyVoucherStats(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.myStats],
    queryFn: fetchMyVoucherStats,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCampaign,
    onSettled: () => invalidateCampaignKeys(queryClient),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; input: CreateCampaignInput }) =>
      updateAdminCampaign(params.id, params.input),
    onSettled: () => invalidateCampaignKeys(queryClient),
  });
}

export function useToggleCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; isActive: boolean }) =>
      toggleAdminCampaign(params.id, params.isActive),
    onSettled: () => invalidateCampaignKeys(queryClient),
  });
}

function invalidateCampaignKeys(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: [...voucherKeys.admin] });
  void queryClient.invalidateQueries({ queryKey: [...voucherKeys.dispatch] });
  void queryClient.invalidateQueries({ queryKey: [...voucherKeys.public] });
}

export function useSoftDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => softDeleteAdminCampaign(campaignId),
    onSettled: () => invalidateCampaignKeys(queryClient),
  });
}

export function useRestoreCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => restoreAdminCampaign(campaignId),
    onSettled: () => invalidateCampaignKeys(queryClient),
  });
}

export function useHardDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; confirm: string }) =>
      hardDeleteAdminCampaign(params.id, params.confirm),
    onSettled: () => invalidateCampaignKeys(queryClient),
  });
}

export function useGrantWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: grantDispatchWallet,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.mine] });
      void queryClient.invalidateQueries({
        queryKey: [...voucherKeys.dispatch],
      });
    },
  });
}

// Dispatchers editing a typed redeem code: the change ripples to every
// campaign surface, including the claimable-code lists customers see at
// booking/checkout, so all of them are invalidated on settle.
export function useUpdateCampaignRedeemCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; redeemCode: string }) =>
      updateCampaignRedeemCode(params.id, params.redeemCode),
    onSettled: () => {
      invalidateCampaignKeys(queryClient);
      void queryClient.invalidateQueries({
        queryKey: ["vouchers", "claimable"],
      });
    },
  });
}

export function useRevokeWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { walletId: string; note?: string }) =>
      revokeDispatchWallet(params.walletId, params.note),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.mine] });
    },
  });
}

export function useAutoRules(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.rules],
    queryFn: fetchAutoRules,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useVoucherProgress(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.progress],
    queryFn: fetchVoucherProgress,
    enabled,
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateAutoRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAutoRule,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.rules] });
      void queryClient.invalidateQueries({
        queryKey: [...voucherKeys.progress],
      });
    },
  });
}

export function useToggleAutoRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { ruleId: string; isActive: boolean }) =>
      toggleAutoRule(params.ruleId, params.isActive),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.rules] });
    },
  });
}
