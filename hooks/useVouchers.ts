"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCampaignInput } from "@/lib/vouchers/voucher.types";
import {
  createAdminCampaign,
  createAutoRule,
  fetchAdminCampaigns,
  fetchAutoRules,
  fetchDispatchCampaigns,
  fetchMyWallets,
  fetchVoucherProgress,
  grantDispatchWallet,
  hardDeleteAdminCampaign,
  restoreAdminCampaign,
  revokeDispatchWallet,
  softDeleteAdminCampaign,
  toggleAdminCampaign,
  toggleAutoRule,
  updateAdminCampaign,
} from "@/services/vouchers.api";

export const voucherKeys = {
  admin: ["vouchers", "admin-campaigns"] as const,
  dispatch: ["vouchers", "dispatch-campaigns"] as const,
  mine: ["vouchers", "mine"] as const,
  rules: ["vouchers", "auto-rules"] as const,
  progress: ["vouchers", "auto-progress"] as const,
};

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

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCampaign,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.admin] });
      void queryClient.invalidateQueries({
        queryKey: [...voucherKeys.dispatch],
      });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; input: CreateCampaignInput }) =>
      updateAdminCampaign(params.id, params.input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.admin] });
      void queryClient.invalidateQueries({
        queryKey: [...voucherKeys.dispatch],
      });
    },
  });
}

export function useToggleCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; isActive: boolean }) =>
      toggleAdminCampaign(params.id, params.isActive),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.admin] });
      void queryClient.invalidateQueries({
        queryKey: [...voucherKeys.dispatch],
      });
    },
  });
}

function invalidateCampaignKeys(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: [...voucherKeys.admin] });
  void queryClient.invalidateQueries({ queryKey: [...voucherKeys.dispatch] });
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
