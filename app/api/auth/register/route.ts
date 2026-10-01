import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/auth.service";
import { setSessionCookies } from "@/lib/auth/cookies";
import { enforceRequestGuards } from "@/lib/auth/guards";
import {
  clearedGuestCookieOptions,
  GUEST_COOKIE,
  readGuestId,
} from "@/lib/auth/guest-session";
import { deviceLabel } from "@/lib/auth/user-sessions";
import { mergeGuestCart } from "@/lib/orders/cart.service";

export async function POST(request: Request) {
  const blocked = await enforceRequestGuards(request, "register");
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

  const input = body as {
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  try {
    const result = await registerUser(
      {
        fullName: input.fullName ?? "",
        phone: input.phone ?? "",
        email: input.email ?? "",
        password: input.password ?? "",
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

    // Same guest-cart handoff as login: a shopper who registered mid
    // funnel keeps what they already picked.
    const guestId = await readGuestId();
    if (guestId && result.user.role === "customer") {
      try {
        await mergeGuestCart(guestId, result.user.id);
      } catch {
        // Best effort only.
      }
    }
    const response = NextResponse.json({ user: result.user }, { status: 201 });
    setSessionCookies(response, result.tokens);
    if (guestId) {
      response.cookies.set(GUEST_COOKIE, "", clearedGuestCookieOptions());
    }
    return response;
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được tài khoản. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
