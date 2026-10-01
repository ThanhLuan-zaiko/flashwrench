import { beforeEach, describe, expect, mock, test } from "bun:test";
import { GUEST_CART_TTL_SECONDS, GUEST_COOKIE } from "@/lib/auth/guest-session";
import { isUuid } from "@/lib/validation";
import { makePublicUser, postJsonRequest } from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  cartServiceRouteMocks,
  nextHeadersMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
} from "../helpers/route-mocks";

// Cart routes serve three shopper kinds through one handler: customers
// (account partition), guests (fw_gid partition) and staff (forbidden).
// The service and the cookie/auth seams are all stubbed.
mock.module("next/headers", () => nextHeadersMocks);
mock.module("@/lib/auth/authorization", () => ({
  authenticateRequest: authorizationMocks.authenticateRequest,
}));
mock.module("@/lib/orders/cart.service", () => cartServiceRouteMocks);

import { PATCH as itemPatch } from "@/app/api/cart/[partId]/route";
import {
  DELETE as cartDelete,
  GET as cartGet,
  POST as cartPost,
} from "@/app/api/cart/route";

const GUEST_ID = "99999999-9999-4999-8999-999999999999";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ITEM_PARAMS = Promise.resolve({ partId: PART_ID });

beforeEach(() => {
  resetRouteMocks();
});

describe("GET /api/cart", () => {
  test("anonymous reads return an empty cart without minting a token", async () => {
    const res = await cartGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ cart: { items: [] } });
    expect(cartServiceRouteMocks.getCartView).not.toHaveBeenCalled();
    expect(res.cookies.get(GUEST_COOKIE)).toBeUndefined();
  });

  test("a guest cookie reads its own cart partition", async () => {
    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const res = await cartGet();
    expect(res.status).toBe(200);
    expect(cartServiceRouteMocks.getCartView.mock.calls[0]).toEqual([GUEST_ID]);
  });

  test("staff reads are forbidden", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    const res = await cartGet();
    expect(res.status).toBe(403);
  });
});

describe("POST /api/cart", () => {
  test("mints fw_gid on the first guest mutation", async () => {
    const res = await cartPost(
      postJsonRequest("/api/cart", { partId: PART_ID, qty: 1 }),
    );
    expect(res.status).toBe(200);

    const minted = res.cookies.get(GUEST_COOKIE)?.value;
    expect(minted).toBeTruthy();
    expect(isUuid(minted ?? "")).toBe(true);
    // The service wrote into the freshly minted guest partition with TTL.
    expect(cartServiceRouteMocks.addToCart.mock.calls[0]?.[0]).toBe(
      minted ?? "",
    );
    expect(cartServiceRouteMocks.addToCart.mock.calls[0]?.[3]).toBe(
      GUEST_CART_TTL_SECONDS,
    );
  });

  test("an existing guest cookie is reused, not re-minted", async () => {
    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const res = await cartPost(
      postJsonRequest("/api/cart", { partId: PART_ID, qty: 2 }),
    );
    expect(res.status).toBe(200);
    expect(res.cookies.get(GUEST_COOKIE)).toBeUndefined();
    expect(cartServiceRouteMocks.addToCart.mock.calls[0]).toEqual([
      GUEST_ID,
      PART_ID,
      2,
      GUEST_CART_TTL_SECONDS,
    ]);
  });

  test("customer carts write without TTL and without guest cookies", async () => {
    const user = makePublicUser();
    routeStubs.bookingUser = user;
    const res = await cartPost(
      postJsonRequest("/api/cart", { partId: PART_ID, qty: 1 }),
    );
    expect(res.status).toBe(200);
    expect(res.cookies.get(GUEST_COOKIE)).toBeUndefined();
    expect(cartServiceRouteMocks.addToCart.mock.calls[0]).toEqual([
      user.id,
      PART_ID,
      1,
      undefined,
    ]);
  });

  test("staff mutations are forbidden before the service runs", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "admin" });
    const res = await cartPost(
      postJsonRequest("/api/cart", { partId: PART_ID, qty: 1 }),
    );
    expect(res.status).toBe(403);
    expect(cartServiceRouteMocks.addToCart).not.toHaveBeenCalled();
    expect(res.cookies.get(GUEST_COOKIE)).toBeUndefined();
  });
});

describe("PATCH /api/cart/[partId]", () => {
  test("guest item updates carry the row TTL", async () => {
    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const res = await itemPatch(
      postJsonRequest(`/api/cart/${PART_ID}`, { qty: 3 }),
      { params: ITEM_PARAMS },
    );
    expect(res.status).toBe(200);
    expect(cartServiceRouteMocks.updateCartItemQty.mock.calls[0]).toEqual([
      GUEST_ID,
      PART_ID,
      3,
      GUEST_CART_TTL_SECONDS,
    ]);
  });

  test("a guest without a minted cart gets 404", async () => {
    const res = await itemPatch(
      postJsonRequest(`/api/cart/${PART_ID}`, { qty: 3 }),
      { params: ITEM_PARAMS },
    );
    expect(res.status).toBe(404);
    expect(cartServiceRouteMocks.updateCartItemQty.mock.calls.length).toBe(0);
  });
});

describe("DELETE /api/cart", () => {
  test("clearing a guest cart that was never minted is a no-op", async () => {
    const res = await cartDelete(
      new Request("http://localhost/api/cart", { method: "DELETE" }),
    );
    expect(res.status).toBe(200);
    expect(cartServiceRouteMocks.clearCart).not.toHaveBeenCalled();
  });

  test("a guest cookie clears its own cart partition", async () => {
    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const res = await cartDelete(
      new Request("http://localhost/api/cart", { method: "DELETE" }),
    );
    expect(res.status).toBe(200);
    expect(cartServiceRouteMocks.clearCart.mock.calls[0]).toEqual([GUEST_ID]);
  });
});
