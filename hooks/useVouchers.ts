"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCampaign,
  fetchAdminCampaigns,
  fetchDispatchCampaigns,
  fetchMyWallets,
  grantDispatchWallet,
  revokeDispatchWallet,
  toggleAdminCampaign,
} from "@/services/vouchers.api";

export const voucherKeys = {
  admin: ["vouchers", "admin-campaigns"] as const,
  dispatch: ["vouchers", "dispatch-campaigns"] as const,
  mine: ["vouchers", "mine"] as const,
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

export function useMyWallets(enabled = true) {
  return useQuery({
    queryKey: [...voucherKeys.mine],
    queryFn: fetchMyWallets,
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

export function useToggleCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; isActive: boolean; code: string }) =>
      toggleAdminCampaign(params.id, params.isActive, params.code),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.admin] });
      void queryClient.invalidateQueries({
        queryKey: [...voucherKeys.dispatch],
      });
    },
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
