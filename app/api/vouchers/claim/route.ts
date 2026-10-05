import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { enforceActorRateLimit, enforceRequestGuards } from "@/lib/auth/guards";
import { claimWalletByCode } from "@/lib/vouchers/voucher-code.service";

// Typed-code claim: pressing "Áp dụng" grants (or reuses) one wallet of
// the campaign owning the code. Throttled per IP and per account.
export async function POST(request: Request) {
  const blocked = await enforceRequestGuards(request, "voucherCode");
  if (blocked) return blocked;
  const { user, response } = await requireRole("customer");
  if (response || !user) return response;
  const throttled = await enforceActorRateLimit("voucherCodeUser", user.id);
  if (throttled) return throttled;
  let body: Record<string, unknown>;
  try {
    body = ((await request.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const kind = body.kind;
  if (kind !== "booking" && kind !== "order") {
    return NextResponse.json(
      { errors: { form: "Loại đơn không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await claimWalletByCode({
      userId: user.id,
      code: body.code,
      kind,
      subtotal: Number(body.subtotal),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không áp được mã. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
