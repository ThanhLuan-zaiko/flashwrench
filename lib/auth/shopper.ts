import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateRequest } from "./authorization";
import {
  GUEST_COOKIE,
  guestCookieOptions,
  newGuestId,
  readGuestId,
} from "./guest-session";
import { ACCESS_COOKIE } from "./session";
import type { PublicUser } from "./user.types";

// One shopper identity for the shop surface (cart + checkout): a
// signed-in customer owns the cart partition named by their account id;
// a guest owns the partition named by the fw_gid cookie. Staff roles
// never get a shopper — counter sales go through the dispatch board.
export type Shopper = {
  // Cart partition owner: user id or guest token. Null means "no cart
  // yet" (anonymous read) or "staff" (check `user` to tell them apart).
  cartId: string | null;
  user: PublicUser | null;
  // Lazily minted on the first guest mutation; routes must Set-Cookie it.
  pendingGuestId: string | null;
  // True when an fw_at cookie was presented but failed verification —
  // revoked family, bumped token_version, or a locked account. The
  // cookie's maxAge mirrors the JWT TTL, so a merely-expired token never
  // reaches the server; a stale one means the session was killed early.
  staleAccessToken: boolean;
};

export async function resolveShopper(options?: {
  createGuest?: boolean;
}): Promise<Shopper> {
  const user = await authenticateRequest();
  const staleAccessToken =
    !user && Boolean((await cookies()).get(ACCESS_COOKIE)?.value);
  if (user) {
    if (user.role !== "customer") {
      return { cartId: null, user, pendingGuestId: null, staleAccessToken };
    }
    return { cartId: user.id, user, pendingGuestId: null, staleAccessToken };
  }
  const guestId = await readGuestId();
  if (guestId) {
    return {
      cartId: guestId,
      user: null,
      pendingGuestId: null,
      staleAccessToken,
    };
  }
  if (!options?.createGuest) {
    return { cartId: null, user: null, pendingGuestId: null, staleAccessToken };
  }
  const minted = newGuestId();
  return {
    cartId: minted,
    user: null,
    pendingGuestId: minted,
    staleAccessToken,
  };
}

// 401 for stale-token shoppers: lets apiRequest's refresh-retry rescue a
// still-live refresh cookie, and blocks the guest fallthrough that would
// silently move a killed session's cart or checkout onto the fw_gid
// partition.
export function staleSessionResponse(): NextResponse {
  return NextResponse.json(
    { errors: { form: "Vui lòng đăng nhập để tiếp tục." } },
    { status: 401 },
  );
}

// Attach a freshly minted guest token to an outgoing API response.
export function attachGuestCookie<T extends NextResponse>(
  response: T,
  shopper: Shopper,
): T {
  if (shopper.pendingGuestId) {
    response.cookies.set(
      GUEST_COOKIE,
      shopper.pendingGuestId,
      guestCookieOptions(),
    );
  }
  return response;
}
