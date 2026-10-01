import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/auth.service";
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

    // Fold the guest cart into the fresh session so items picked before
    // signing in survive; the fw_gid token is retired afterwards. A
    // merge failure must not block the login — the stale guest rows die
    // with their TTL anyway.
    const guestId = await readGuestId();
    if (guestId && result.user.role === "customer") {
      try {
        await mergeGuestCart(guestId, result.user.id);
      } catch {
        // Best effort only.
      }
    }
    const response = NextResponse.json({ user: result.user });
    setSessionCookies(response, result.tokens);
    if (guestId) {
      response.cookies.set(GUEST_COOKIE, "", clearedGuestCookieOptions());
    }
    return response;
  } catch {
    return NextResponse.json(
      { errors: { form: "Không đăng nhập được. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
