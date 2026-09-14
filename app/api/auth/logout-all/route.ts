import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate, revokeAllSessions } from "@/lib/auth/auth.service";
import { clearSessionCookies } from "@/lib/auth/cookies";
import { ACCESS_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;

  const response = NextResponse.json({ ok: true });
  try {
    if (access) {
      const user = await authenticate(access);
      if (user) await revokeAllSessions(user.id);
    }
  } catch {
    // Client-side logout always succeeds, even when the DB write fails.
  }
  clearSessionCookies(response);
  return response;
}
