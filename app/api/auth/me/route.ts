import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/auth.service";
import { ACCESS_COOKIE } from "@/lib/auth/session";

export async function GET() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const user = await authenticate(token);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
