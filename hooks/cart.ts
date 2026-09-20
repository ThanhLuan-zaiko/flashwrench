"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartView } from "@/lib/orders/orders.types";
import {
  addToCartRequest,
  clearCartRequest,
  fetchCart,
  removeCartItemRequest,
  updateCartItemRequest,
} from "@/services/cart.api";
import { useMe } from "./auth";

export const cartKeys = {
  all: ["cart"] as const,
};

// The cart only exists for logged-in customers. Guests skip the fetch so
// the badge and the /cart page never fire a doomed request.
export function useCart() {
  const me = useMe();
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: () => fetchCart(),
    enabled: me.data?.role === "customer",
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

function useCartMutation<TVariables>(
  fn: (variables: TVariables) => Promise<{ cart: CartView }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      // The server returns the whole cart view; write it straight into
      // the cache so every consumer updates in one render.
      queryClient.setQueryData(cartKeys.all, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useAddToCart() {
  return useCartMutation(({ partId, qty }: { partId: string; qty: number }) =>
    addToCartRequest(partId, qty),
  );
}

export function useUpdateCartItem() {
  return useCartMutation(({ partId, qty }: { partId: string; qty: number }) =>
    updateCartItemRequest(partId, qty),
  );
}

export function useRemoveCartItem() {
  return useCartMutation(({ partId }: { partId: string }) =>
    removeCartItemRequest(partId),
  );
}

export function useClearCart() {
  return useCartMutation(() => clearCartRequest());
}
