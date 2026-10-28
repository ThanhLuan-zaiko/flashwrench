import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { isUuid } from "@/lib/validation";
import {
  GUEST_COOKIE,
  GUEST_COOKIE_TTL_SECONDS,
} from "./guest-session.constants";

// Guest identity for the shop surface: a bare unguessable UUID cookie
// (same capability model as the public rescue tracking link). It owns a
// carts_by_customer partition plus the browser's guest_records_by_gid
// index and is never an auth credential, so it needs no signing — a
// forged value just points at an empty cart and an empty history.
export {
  GUEST_CART_TTL_SECONDS,
  GUEST_COOKIE,
  GUEST_COOKIE_TTL_SECONDS,
} from "./guest-session.constants";

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
