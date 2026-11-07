import { type NextRequest, NextResponse } from "next/server";
import { classifyTraffic } from "@/lib/security/traffic";
import { type RefreshOutcome, refreshSession } from "./auth.service";
import { clearSessionCookies, setSessionCookies } from "./cookies";
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyAccessToken } from "./session";
import { deviceLabel } from "./user-sessions";

// The access cookie lives 15 minutes while the refresh cookie lives 30
// days. Client fetches recover through POST /api/auth/refresh on a 401,
// but server-gated pages (/mechanic, /dispatch, /admin, /login) only read
// the access cookie and cannot set cookies themselves, so after a quiet
// spell they treated a signed-in user as a guest and bounced to /login.
// The proxy runs before rendering and CAN write cookies, so it rotates the
// session here and hands the fresh access token to the render as well.

export function wantsSessionResume(request: NextRequest): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (classifyTraffic(request.nextUrl.pathname, request.method) !== "page") {
    return false;
  }
  return Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
}

async function hasValidAccess(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return false;
  return (await verifyAccessToken(token)) !== null;
}

// Returns null when nothing needs to change (valid access token, or a
// transient failure the client-side refresh can still retry later).
export async function resumeSessionResponse(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (await hasValidAccess(request)) return null;
  const raw = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!raw) return null;

  let outcome: RefreshOutcome;
  try {
    outcome = await refreshSession(
      raw,
      deviceLabel(request.headers.get("user-agent")),
    );
  } catch {
    return null;
  }

  if (!outcome.ok) {
    // Dead refresh token: drop it so later page loads skip this lookup.
    const response = forwardWithCookies(request, {});
    clearSessionCookies(response);
    return response;
  }

  // Rewrite the incoming Cookie header so Server Components in this same
  // request see the new session, then persist it in the browser.
  const response = forwardWithCookies(request, {
    [ACCESS_COOKIE]: outcome.tokens.accessToken,
    [REFRESH_COOKIE]: outcome.tokens.refreshToken,
  });
  setSessionCookies(response, outcome.tokens);
  return response;
}

// Builds the upstream Cookie header by hand: mutating request.cookies makes
// Next.js mirror bare copies (no Max-Age/Secure) onto the browser response.
function forwardWithCookies(
  request: NextRequest,
  session: Record<string, string>,
): NextResponse {
  const pairs = request.cookies
    .getAll()
    .filter((c) => c.name !== ACCESS_COOKIE && c.name !== REFRESH_COOKIE)
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`);
  for (const [name, value] of Object.entries(session)) {
    pairs.push(`${name}=${encodeURIComponent(value)}`);
  }
  const headers = new Headers(request.headers);
  if (pairs.length > 0) headers.set("cookie", pairs.join("; "));
  else headers.delete("cookie");
  return NextResponse.next({ request: { headers } });
}
