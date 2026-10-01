import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { isUuid } from "@/lib/validation";
import { quoteWalletRedemption } from "@/lib/vouchers/voucher-spend.service";

// Quote endpoint: reports what a wallet would shave off a given subtotal
// without spending it. The wallet only turns "used" inside the real
// checkout/booking write paths — a preview can never burn or rebind it,
// and client-sent order/booking ids are never written to the wallet row.
export async function POST(
  request: Request,
  context: { params: Promise<{ walletId: string }> },
) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { walletId } = await context.params;
  if (!isUuid(walletId)) {
    return NextResponse.json(
      { errors: { form: "Voucher không hợp lệ." } },
      { status: 400 },
    );
  }
  let body: Record<string, unknown> = {};
  try {
    body = ((await request.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await quoteWalletRedemption({
      walletId,
      userId: user.id,
      subtotal: Number(body.subtotal ?? 0),
      kind:
        body.bookingId !== undefined && body.bookingId !== null
          ? "booking"
          : "order",
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
      { errors: { form: "Không áp được voucher. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
