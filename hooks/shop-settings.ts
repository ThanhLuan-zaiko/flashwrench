"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BUSINESS_HOURS_TOPIC,
  SHOP_PROFILE_TOPIC,
} from "@/lib/realtime/protocol";
import {
  type BusinessHoursPayload,
  fetchAdminBusinessHours,
  fetchAdminShopProfile,
  fetchPublicBusinessHours,
  fetchPublicShopProfile,
  type ShopProfilePayload,
  updateAdminBusinessHours,
  updateAdminShopProfile,
} from "@/services/shop-settings.api";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const shopSettingsKeys = {
  profilePublic: ["shop-profile", "public"] as const,
  profileAdmin: ["shop-profile", "admin"] as const,
  hoursPublic: ["business-hours", "public"] as const,
  hoursAdmin: ["business-hours", "admin"] as const,
};

// Public reads are stale-tolerant: submit-time server validation
// re-checks the live values either way.
export function usePublicShopProfile() {
  return useQuery({
    queryKey: shopSettingsKeys.profilePublic,
    queryFn: fetchPublicShopProfile,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function usePublicBusinessHours() {
  return useQuery({
    queryKey: shopSettingsKeys.hoursPublic,
    queryFn: fetchPublicBusinessHours,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminShopProfile() {
  return useQuery({
    queryKey: shopSettingsKeys.profileAdmin,
    queryFn: fetchAdminShopProfile,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminBusinessHours() {
  return useQuery({
    queryKey: shopSettingsKeys.hoursAdmin,
    queryFn: fetchAdminBusinessHours,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useShopProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShopProfilePayload) =>
      updateAdminShopProfile(payload),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: shopSettingsKeys.profileAdmin,
      });
      void queryClient.invalidateQueries({
        queryKey: shopSettingsKeys.profilePublic,
      });
    },
  });
}

export function useBusinessHoursMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessHoursPayload) =>
      updateAdminBusinessHours(payload),
    onSettled: () => {
      // A new window must reach open booking forms, not just the card.
      void queryClient.invalidateQueries({
        queryKey: shopSettingsKeys.hoursAdmin,
      });
      void queryClient.invalidateQueries({
        queryKey: shopSettingsKeys.hoursPublic,
      });
    },
  });
}

// Invalidate both profile reads when an admin edits the storefront.
// Topics are public so guest-facing surfaces see the change too.
export function useShopProfileRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: shopSettingsKeys.profilePublic,
    });
    void queryClient.invalidateQueries({
      queryKey: shopSettingsKeys.profileAdmin,
    });
  };
  useRealtimeTopic(SHOP_PROFILE_TOPIC, {
    enabled,
    onEvent: invalidate,
    onReconnect: invalidate,
  });
}

export function useBusinessHoursRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: shopSettingsKeys.hoursPublic,
    });
    void queryClient.invalidateQueries({
      queryKey: shopSettingsKeys.hoursAdmin,
    });
  };
  useRealtimeTopic(BUSINESS_HOURS_TOPIC, {
    enabled,
    onEvent: invalidate,
    onReconnect: invalidate,
  });
}
