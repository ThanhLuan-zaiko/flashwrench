"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";
import {
  claimVoucherCode,
  fetchCampaignRedeemCode,
  fetchClaimableCodes,
} from "@/services/voucher-code.api";
import type { MyWalletPage } from "@/services/vouchers.api";
import { voucherKeys } from "./useVouchers";

// Claim a typed redeem code: the returned wallet is usable right away,
// so the cached wallet pages prepend it before invalidation refetches —
// otherwise pickers could flash "không còn phù hợp" while the customer
// is already looking at their new voucher.
export function useClaimVoucherCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: claimVoucherCode,
    onSuccess: (data) => {
      queryClient.setQueriesData<MyWalletPage>(
        { queryKey: [...voucherKeys.mine] },
        (page) =>
          page && !page.items.some((item) => item.id === data.wallet.id)
            ? { ...page, items: [data.wallet, ...page.items] }
            : page,
      );
      void queryClient.invalidateQueries({ queryKey: [...voucherKeys.mine] });
      void queryClient.invalidateQueries({
        queryKey: ["vouchers", "campaign-code"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["vouchers", "claimable"],
      });
    },
  });
}

// Redeem-code campaigns this customer could still claim for the kind;
// kind null asks for every scope (the /vouchers shelf).
export function useClaimableCodes(kind: VoucherKind | null, enabled: boolean) {
  return useQuery({
    queryKey: [...voucherKeys.claimable(kind ?? "all")],
    queryFn: () => fetchClaimableCodes(kind),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

// Whether this signed-in customer may see the campaign's typed code.
export function useCampaignRedeemCode(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: [...voucherKeys.campaignCode(slug)],
    queryFn: () => fetchCampaignRedeemCode(slug),
    enabled: enabled && slug.trim() !== "",
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
