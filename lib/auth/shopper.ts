import type { NextResponse } from "next/server";
import { authenticateRequest } from "./authorization";
import {
  GUEST_COOKIE,
  guestCookieOptions,
  newGuestId,
  readGuestId,
} from "./guest-session";
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
};

export async function resolveShopper(options?: {
  createGuest?: boolean;
}): Promise<Shopper> {
  const user = await authenticateRequest();
  if (user) {
    if (user.role !== "customer") {
      return { cartId: null, user, pendingGuestId: null };
    }
    return { cartId: user.id, user, pendingGuestId: null };
  }
  const guestId = await readGuestId();
  if (guestId) {
    return { cartId: guestId, user: null, pendingGuestId: null };
  }
  if (!options?.createGuest) {
    return { cartId: null, user: null, pendingGuestId: null };
  }
  const minted = newGuestId();
  return { cartId: minted, user: null, pendingGuestId: minted };
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
