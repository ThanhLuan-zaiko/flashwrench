import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  clearedCookieOptions,
  LEGACY_COOKIE,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from "./session";
import type { SessionTokens } from "./user.types";

export function setSessionCookies(
  response: NextResponse,
  tokens: SessionTokens,
): void {
  response.cookies.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    accessCookieOptions(),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    refreshCookieOptions(),
  );
  response.cookies.set(LEGACY_COOKIE, "", clearedCookieOptions());
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", clearedCookieOptions());
  response.cookies.set(REFRESH_COOKIE, "", clearedCookieOptions());
  response.cookies.set(LEGACY_COOKIE, "", clearedCookieOptions());
}
