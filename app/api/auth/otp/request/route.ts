import { NextResponse } from "next/server";
import { enforceRequestGuards } from "@/lib/auth/guards";
import { requestEmailOtp } from "@/lib/otp/otp.service";

// Always 200 with a uniform body so the endpoint cannot be used to test
// whether an address is known here. Only transport and rate-limit failures
// answer with a different status.
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

  const input = body as { email?: string; purpose?: string };
  const result = await requestEmailOtp({
    email: input.email,
    purpose: input.purpose,
  });

  if (!result.ok) {
    return NextResponse.json(
      { errors: result.errors },
      { status: result.status },
    );
  }
  return NextResponse.json(result.data);
}
