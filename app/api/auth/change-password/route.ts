import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/auth.service";
import { setSessionCookies } from "@/lib/auth/cookies";
import { enforceRequestGuards } from "@/lib/auth/guards";
import { changePassword } from "@/lib/auth/password-change.service";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { deviceLabel } from "@/lib/auth/user-sessions";
import { STAFF_PASSWORDS_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

export async function POST(request: Request) {
  const blocked = await enforceRequestGuards(request, "password");
  if (blocked) return blocked;

  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (!access) return NextResponse.json({ user: null }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  const input = body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  try {
    const user = await authenticate(access);
    if (!user) return NextResponse.json({ user: null }, { status: 401 });

    const result = await changePassword(
      user.id,
      {
        currentPassword: input.currentPassword ?? "",
        newPassword: input.newPassword ?? "",
        confirmPassword: input.confirmPassword ?? "",
      },
      deviceLabel(request.headers.get("user-agent")),
    );

    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }

    // The service already cleared a pending staff temp password; tell
    // admin screens to drop it in realtime.
    void publishRealtimeEvent(STAFF_PASSWORDS_TOPIC, {
      kind: "changed",
      userId: user.id,
    });

    const response = NextResponse.json({ user: result.user });
    setSessionCookies(response, result.tokens);
    return response;
  } catch {
    return NextResponse.json(
      { errors: { form: "Không đổi được mật khẩu. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
