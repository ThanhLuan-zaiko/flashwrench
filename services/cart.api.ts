import type { CartView } from "@/lib/orders/orders.types";
import { apiRequest } from "./auth.api";

export type CartResponse = { cart: CartView };

export function fetchCart(): Promise<CartResponse> {
  return apiRequest<CartResponse>("/api/cart");
}

export function addToCartRequest(
  partId: string,
  qty: number,
): Promise<CartResponse> {
  return apiRequest<CartResponse>("/api/cart", {
    method: "POST",
    body: JSON.stringify({ partId, qty }),
  });
}

export function updateCartItemRequest(
  partId: string,
  qty: number,
): Promise<CartResponse> {
  return apiRequest<CartResponse>(`/api/cart/${encodeURIComponent(partId)}`, {
    method: "PATCH",
    body: JSON.stringify({ qty }),
  });
}

export function removeCartItemRequest(partId: string): Promise<CartResponse> {
  return apiRequest<CartResponse>(`/api/cart/${encodeURIComponent(partId)}`, {
    method: "DELETE",
  });
}

export function clearCartRequest(): Promise<CartResponse> {
  return apiRequest<CartResponse>("/api/cart", { method: "DELETE" });
}
