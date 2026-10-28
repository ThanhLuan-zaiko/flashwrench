import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Shopper } from "@/lib/auth/shopper";
import type { PublicUser } from "@/lib/auth/user.types";
import { makePublicUser, postJsonRequest } from "../helpers/auth.fixtures";
import {
  guestRecordsRouteMocks,
  resetGuestRecordsMocks,
} from "../helpers/guest-records.mocks";
import { makeRescueInput } from "../helpers/rescue.fixtures";

// Helpers first, mocks second, system under test last. The rescue intake and
// the checkout route only differ from their pre-feature shape by one call to
// the browser-linking glue, so every other dependency is a thin stub.
const RESCUE_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";
const GUEST_ID = "99999999-9999-4999-8999-999999999999";

const stubs = {
  rescueUser: null as PublicUser | null,
  shopper: null as Shopper | null,
};

mock.module("@/lib/auth/authorization", () => ({
  authenticateRequest: mock(async () => stubs.rescueUser),
  requireRole: mock(async () => ({ user: null, response: null })),
}));
mock.module("@/lib/rescue/rescue.service", () => ({
  createRescueRequest: mock(async () => ({
    ok: true,
    data: { requestId: RESCUE_ID, status: "open" },
  })),
}));
mock.module("@/lib/rescue/rescue-reader.service", () => ({
  listCustomerRescues: mock(async () => ({ ok: true, data: [] })),
}));
mock.module("@/lib/mail/confirmation.service", () => ({
  notifyRescueCreated: mock(() => undefined),
  notifyOrderCreated: mock(() => undefined),
}));
mock.module("@/lib/auth/shopper", () => ({
  resolveShopper: mock(async () => stubs.shopper),
  staleSessionResponse: mock(() => new Response(null, { status: 401 })),
}));
mock.module("@/lib/orders/checkout.service", () => ({
  checkoutCart: mock(async () => ({
    ok: true,
    data: { id: ORDER_ID, status: "pending", customerId: "c" },
  })),
  checkoutGuestCart: mock(async () => ({
    ok: true,
    data: { id: ORDER_ID, status: "pending", customerId: null },
  })),
}));
mock.module("@/lib/orders/orders-read.service", () => ({
  listMyOrders: mock(async () => ({ ok: true, data: [] })),
}));
mock.module("@/lib/realtime/domain-publish", () => ({
  publishOrderChange: mock(async () => undefined),
}));
mock.module(
  "@/lib/guest-records/guest-records.route",
  () => guestRecordsRouteMocks,
);

import { POST as ordersPost } from "@/app/api/orders/route";
import { POST as rescuePost } from "@/app/api/rescue/route";

const CHECKOUT_BODY = {
  recipientName: "Tran Thi Be",
  phone: "0909999888",
  email: "be@example.com",
  fulfillment: "pickup",
  paymentMethod: "counter",
};

function guestShopper(): Shopper {
  return {
    cartId: GUEST_ID,
    user: null,
    pendingGuestId: null,
    staleAccessToken: false,
  };
}

beforeEach(() => {
  resetGuestRecordsMocks();
  stubs.rescueUser = null;
  stubs.shopper = guestShopper();
});

describe("POST /api/rescue", () => {
  test("links an anonymous rescue request to the browser", async () => {
    const res = await rescuePost(
      postJsonRequest("/api/rescue", makeRescueInput()),
    );
    expect(res.status).toBe(201);
    const [, recordType, recordId] =
      guestRecordsRouteMocks.linkGuestRecordToBrowser.mock.calls[0] ?? [];
    expect(recordType).toBe("rescue");
    expect(recordId).toBe(RESCUE_ID);
  });

  test("leaves a signed-in customer's request unlinked", async () => {
    stubs.rescueUser = makePublicUser();
    const res = await rescuePost(
      postJsonRequest("/api/rescue", makeRescueInput()),
    );
    expect(res.status).toBe(201);
    expect(
      guestRecordsRouteMocks.linkGuestRecordToBrowser,
    ).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders", () => {
  test("links a guest checkout to the browser", async () => {
    const res = await ordersPost(postJsonRequest("/api/orders", CHECKOUT_BODY));
    expect(res.status).toBe(201);
    const [, recordType, recordId] =
      guestRecordsRouteMocks.linkGuestRecordToBrowser.mock.calls[0] ?? [];
    expect(recordType).toBe("order");
    expect(recordId).toBe(ORDER_ID);
  });

  test("leaves a customer checkout unlinked", async () => {
    const user = makePublicUser();
    stubs.shopper = { ...guestShopper(), cartId: user.id, user };
    const res = await ordersPost(postJsonRequest("/api/orders", CHECKOUT_BODY));
    expect(res.status).toBe(201);
    expect(
      guestRecordsRouteMocks.linkGuestRecordToBrowser,
    ).not.toHaveBeenCalled();
  });
});
