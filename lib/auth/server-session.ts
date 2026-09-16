import { cookies } from "next/headers";
import { cache } from "react";
import type { AccountSession } from "./account-status";
import { readAccountSession } from "./account-status.service";
import { ACCESS_COOKIE } from "./session";

// Server-side mirror of GET /api/auth/me for Server Components: same
// cookie, same reader, same anonymous fallbacks, so the server-rendered
// header and the client cache agree on the first paint. The root layout
// seeds React Query with this and every page becomes dynamic on purpose:
// correctness of the header (no login-state flash, no extra round trip)
// is worth more than serving a static shell with a spinner.
export async function readServerAccountSession(): Promise<AccountSession> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return { user: null, status: "active" };
  try {
    return await readAccountSession(token);
  } catch {
    return { user: null, status: "active" };
  }
}

// Request-memoized variant for layouts: every Server Component in one
// request shares a single user lookup. Tests target the uncached reader
// above because React cache() has no request scope outside Next.js.
export const getServerAccountSession = cache(readServerAccountSession);
