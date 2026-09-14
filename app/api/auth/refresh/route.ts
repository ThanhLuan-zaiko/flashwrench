import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth/auth.service";
import { clearSessionCookies, setSessionCookies } from "@/lib/auth/cookies";
import { enforceRequestGuards } from "@/lib/auth/guards";
import { REFRESH_COOKIE } from "@/lib/auth/session";
import { deviceLabel } from "@/lib/auth/user-sessions";

export async function POST(request: Request) {
  const blocked = await enforceRequestGuards(request, "refresh");
  if (blocked) return blocked;

  const store = await cookies();
  const raw = store.get(REFRESH_COOKIE)?.value;
  if (!raw) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const outcome = await refreshSession(
      raw,
      deviceLabel(request.headers.get("user-agent")),
    );
    if (!outcome.ok) {
      const response = NextResponse.json(
        {
          user: null,
          errors: outcome.revoked
            ? {
                form: "Phiên đăng nhập có dấu hiệu bất thường và đã bị thu hồi. Vui lòng đăng nhập lại.",
              }
            : undefined,
        },
        { status: 401 },
      );
      if (outcome.revoked) clearSessionCookies(response);
      return response;
    }
    const response = NextResponse.json({ user: outcome.user });
    setSessionCookies(response, outcome.tokens);
    return response;
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
