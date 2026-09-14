import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/auth.service";
import { setSessionCookies } from "@/lib/auth/cookies";
import { enforceRequestGuards } from "@/lib/auth/guards";
import { deviceLabel } from "@/lib/auth/user-sessions";

export async function POST(request: Request) {
  const blocked = await enforceRequestGuards(request, "login");
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  const input = body as { identifier?: string; password?: string };

  try {
    const result = await loginUser(
      {
        identifier: input.identifier ?? "",
        password: input.password ?? "",
      },
      deviceLabel(request.headers.get("user-agent")),
    );

    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }

    const response = NextResponse.json({ user: result.user });
    setSessionCookies(response, result.tokens);
    return response;
  } catch {
    return NextResponse.json(
      { errors: { form: "Không đăng nhập được. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
