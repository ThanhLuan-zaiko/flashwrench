import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/auth.service";
import {
  ACCESS_COOKIE,
  parseRefreshToken,
  REFRESH_COOKIE,
} from "@/lib/auth/session";
import { listUserSessions } from "@/lib/auth/user-sessions";

export async function GET() {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (!access) return NextResponse.json({ sessions: [] }, { status: 401 });

  try {
    const user = await authenticate(access);
    if (!user) return NextResponse.json({ sessions: [] }, { status: 401 });
    const rawRefresh = store.get(REFRESH_COOKIE)?.value;
    const current = rawRefresh
      ? parseRefreshToken(rawRefresh)?.familyId
      : undefined;
    const sessions = await listUserSessions(user.id, current);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: [] }, { status: 500 });
  }
}
