import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate, revokeSession } from "@/lib/auth/auth.service";
import { ACCESS_COOKIE } from "@/lib/auth/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ familyId: string }> },
) {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (!access) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const user = await authenticate(access);
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const { familyId } = await params;
    if (!familyId) return NextResponse.json({ ok: false }, { status: 400 });
    await revokeSession(user.id, familyId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
