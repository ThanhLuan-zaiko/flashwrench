// TanStack Query wrappers for the OTP lookup. The record list is only
// enabled once a guest-access cookie exists, so a fresh visitor never fires a
// request that is guaranteed to 401.
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import {
  fetchGuestInvoice,
  fetchGuestRecords,
  requestOtpRequest,
  requestOtpVerify,
} from "@/services/guest-access.api";

export const guestAccessKeys = {
  all: ["guest-access"] as const,
  records: ["guest-access", "records"] as const,
  invoice: (type: GuestRecordType, id: string) =>
    ["guest-access", "invoice", { type, id }] as const,
};

export function useOtpRequest() {
  return useMutation({
    mutationFn: (email: string) => requestOtpRequest(email),
    // Codes are short-lived: a failed network blip is not worth an automatic
    // resend, which would burn the resend cooldown and the SMTP quota.
    retry: false,
  });
}

export function useOtpVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      requestOtpVerify(input.email, input.code),
    retry: false,
    // The cookie now exists, so the list can finally be fetched.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: guestAccessKeys.records });
    },
  });
}

export function useGuestRecords(enabled: boolean) {
  return useQuery({
    queryKey: guestAccessKeys.records,
    queryFn: fetchGuestRecords,
    enabled,
    // Anonymous history only shifts when the visitor files something new in
    // another tab, so a short stale window is plenty.
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useGuestInvoice(
  type: GuestRecordType,
  id: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: guestAccessKeys.invoice(type, id),
    queryFn: () => fetchGuestInvoice(type, id),
    enabled: enabled && Boolean(id),
    // An invoice is a settled document; caching it avoids a refetch every
    // time the visitor reopens it.
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}
