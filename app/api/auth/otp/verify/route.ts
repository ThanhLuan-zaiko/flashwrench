import { NextResponse } from "next/server";
import { enforceRequestGuards } from "@/lib/auth/guards";
import {
  createGuestAccessToken,
  GUEST_ACCESS_COOKIE,
  guestAccessCookieOptions,
} from "@/lib/auth/guest-access";
import { verifyEmailOtp } from "@/lib/otp/otp.service";

// Exchanges a code for a read-only guest-access cookie. Deliberately does not
// mint a real session: no user row, no password, no write access anywhere.
export async function POST(request: Request) {
  const blocked = await enforceRequestGuards(request, "otp");
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
    email?: string;
    code?: string;
    purpose?: string;
  };
  const result = await verifyEmailOtp({
    email: input.email,
    code: input.code,
    purpose: input.purpose,
  });

  if (!result.ok) {
    return NextResponse.json(
      { errors: result.errors },
      { status: result.status },
    );
  }

  const response = NextResponse.json({ verified: true });
  response.cookies.set(
    GUEST_ACCESS_COOKIE,
    createGuestAccessToken(result.data.email),
    guestAccessCookieOptions(),
  );
  return response;
}
