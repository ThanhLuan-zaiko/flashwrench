import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { isUuid } from "@/lib/validation";

// Guest identity for the shop surface: a bare unguessable UUID cookie
// (same capability model as the public rescue tracking link). It only
// owns a carts_by_customer partition and is never an auth credential,
// so it needs no signing — a forged value just points at an empty cart.
export const GUEST_COOKIE = "fw_gid";
export const GUEST_COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;
// Guest cart rows self-expire: the cookie can outlive the data on
// purpose, a stale token just sees an empty cart again.
export const GUEST_CART_TTL_SECONDS = 7 * 24 * 60 * 60;

export function newGuestId(): string {
  return randomUUID();
}

export function guestCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_TTL_SECONDS,
  };
}

export function clearedGuestCookieOptions() {
  return { ...guestCookieOptions(), maxAge: 0 };
}

export async function readGuestId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(GUEST_COOKIE)?.value;
  return raw && isUuid(raw) ? raw : null;
}
