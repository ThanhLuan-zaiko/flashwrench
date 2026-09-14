import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth/auth.service";
import { clearSessionCookies } from "@/lib/auth/cookies";
import { parseRefreshToken, REFRESH_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const store = await cookies();
  const raw = store.get(REFRESH_COOKIE)?.value;
  const parsed = raw ? parseRefreshToken(raw) : null;

  const response = NextResponse.json({ ok: true });
  try {
    if (parsed) await revokeSession(parsed.userId, parsed.familyId);
  } catch {
    // Client-side logout always succeeds, even when the DB write fails.
  }
  clearSessionCookies(response);
  return response;
}
