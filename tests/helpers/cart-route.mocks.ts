// Route-level stubs for the shop cart endpoints and the login/register
// guest-cart merge. Same pattern as media-route.mocks.ts: suites drive
// outcomes through `cartRouteStubs` and assert on `mock.calls`.
import { mock } from "bun:test";
import type { CartView, OrdersResult } from "@/lib/orders/orders.types";

export const cartRouteStubs = {
  cartResult: null as OrdersResult<CartView> | null,
  mergeGuestCartFails: false,
};

function stubbedCart(): OrdersResult<CartView> {
  return (
    cartRouteStubs.cartResult ?? {
      ok: true,
      data: { items: [], subtotal: 0, itemCount: 0 },
    }
  );
}

export const cartServiceRouteMocks = {
  getCartView: mock(
    async (_cartId: string): Promise<OrdersResult<CartView>> => stubbedCart(),
  ),
  addToCart: mock(
    async (
      _cartId: string,
      _partId: string,
      _qty: unknown,
      _ttlSeconds?: number,
    ): Promise<OrdersResult<CartView>> => stubbedCart(),
  ),
  updateCartItemQty: mock(
    async (
      _cartId: string,
      _partId: string,
      _qty: unknown,
      _ttlSeconds?: number,
    ): Promise<OrdersResult<CartView>> => stubbedCart(),
  ),
  removeCartItem: mock(
    async (_cartId: string, _partId: string): Promise<OrdersResult<CartView>> =>
      stubbedCart(),
  ),
  clearCart: mock(
    async (_cartId: string): Promise<OrdersResult<CartView>> => stubbedCart(),
  ),
  mergeGuestCart: mock(
    async (_guestId: string, _customerId: string): Promise<void> => {
      if (cartRouteStubs.mergeGuestCartFails) throw new Error("db down");
    },
  ),
};

export function resetCartRouteMocks(): void {
  cartRouteStubs.cartResult = null;
  cartRouteStubs.mergeGuestCartFails = false;
  for (const fn of Object.values(cartServiceRouteMocks)) fn.mockClear();
}
