import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAccountSession } from "@/lib/auth/account-status.service";
import { ACCESS_COOKIE } from "@/lib/auth/session";

// Reports the account status alongside the user so the browser can tell a
// normal end of session from an admin lock: the lock guard needs that to
// force a logout with the right notice (see components/auth/AccountLockGuard).
export async function GET() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null, status: "active" });

  try {
    const session = await readAccountSession(token);
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ user: null, status: "active" });
  }
}
