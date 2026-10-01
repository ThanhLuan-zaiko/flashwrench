import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { publishWalletChange } from "@/lib/vouchers/voucher-realtime";
import { redeemWallet } from "@/lib/vouchers/voucher-wallet.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ walletId: string }> },
) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { walletId } = await context.params;
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
    const orderId =
      body.orderId === undefined || body.orderId === null
        ? null
        : String(body.orderId);
    const bookingId =
      body.bookingId === undefined || body.bookingId === null
        ? null
        : String(body.bookingId);
    // Preview-only call (no ref yet) validates as an order-kind quote.
    const result = await redeemWallet({
      walletId,
      userId: user.id,
      subtotal: Number(body.subtotal ?? 0),
      kind: bookingId ? "booking" : "order",
      orderId,
      bookingId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishWalletChange({
      kind: "voucher-used",
      walletId,
      userId: user.id,
    });
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không áp được voucher. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
