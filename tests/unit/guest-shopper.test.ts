import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/validation";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  nextHeadersMocks,
  resetRouteMocks,
  routeStubs,
  setMockCookies,
} from "../helpers/route-mocks";

// The shopper resolver only needs the cookie store and the optional-auth
// guard — both stubbed through the shared route handles. No React, no DB.
mock.module("next/headers", () => nextHeadersMocks);
mock.module("@/lib/auth/authorization", () => ({
  authenticateRequest: authorizationMocks.authenticateRequest,
}));

import { GUEST_COOKIE } from "@/lib/auth/guest-session";
import { attachGuestCookie, resolveShopper } from "@/lib/auth/shopper";

const GUEST_ID = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  resetRouteMocks();
});

describe("resolveShopper", () => {
  test("a customer session owns its account cart partition", async () => {
    const user = makePublicUser();
    routeStubs.bookingUser = user;
    const shopper = await resolveShopper();

    expect(shopper.user?.id).toBe(user.id);
    expect(shopper.cartId).toBe(user.id);
    expect(shopper.pendingGuestId).toBeNull();
  });

  test("staff roles never get a cart partition", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "mechanic" });
    const shopper = await resolveShopper({ createGuest: true });

    expect(shopper.user?.role).toBe("mechanic");
    expect(shopper.cartId).toBeNull();
    // Even a mutation request must not mint a guest token for staff.
    expect(shopper.pendingGuestId).toBeNull();
  });

  test("anonymous reads see no cart and mint nothing", async () => {
    const shopper = await resolveShopper();

    expect(shopper.user).toBeNull();
    expect(shopper.cartId).toBeNull();
    expect(shopper.pendingGuestId).toBeNull();
  });

  test("an existing guest cookie owns its cart partition", async () => {
    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const shopper = await resolveShopper();

    expect(shopper.user).toBeNull();
    expect(shopper.cartId).toBe(GUEST_ID);
    expect(shopper.pendingGuestId).toBeNull();
  });

  test("a malformed guest cookie is ignored", async () => {
    setMockCookies({ [GUEST_COOKIE]: "not-a-uuid" });
    const shopper = await resolveShopper();

    expect(shopper.cartId).toBeNull();
    expect(shopper.pendingGuestId).toBeNull();
  });

  test("a guest mutation mints a fresh token lazily", async () => {
    const shopper = await resolveShopper({ createGuest: true });

    expect(shopper.cartId).not.toBeNull();
    expect(shopper.pendingGuestId).toBe(shopper.cartId);
    expect(isUuid(shopper.pendingGuestId ?? "")).toBe(true);
  });

  test("a guest mutation reuses an existing cookie instead of minting", async () => {
    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const shopper = await resolveShopper({ createGuest: true });

    expect(shopper.cartId).toBe(GUEST_ID);
    expect(shopper.pendingGuestId).toBeNull();
  });
});

describe("attachGuestCookie", () => {
  test("sets fw_gid only when a token was minted this request", async () => {
    const minted = await resolveShopper({ createGuest: true });
    const response = attachGuestCookie(NextResponse.json({ ok: true }), minted);
    expect(response.cookies.get(GUEST_COOKIE)?.value).toBe(
      minted.pendingGuestId ?? "",
    );

    setMockCookies({ [GUEST_COOKIE]: GUEST_ID });
    const existing = await resolveShopper({ createGuest: true });
    const untouched = attachGuestCookie(
      NextResponse.json({ ok: true }),
      existing,
    );
    expect(untouched.cookies.get(GUEST_COOKIE)).toBeUndefined();
  });
});
