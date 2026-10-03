import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { isUuid } from "@/lib/validation";
import { getMyWalletDetail } from "@/lib/vouchers/voucher-wallet.service";

// Owner-only wallet detail for /vouchers/w/[walletId]. A wallet of
// another account reads as 404 so ids cannot be probed across owners.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ walletId: string }> },
) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { walletId } = await params;
  if (!isUuid(walletId)) {
    return NextResponse.json(
      { errors: { form: "Voucher không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await getMyWalletDetail(user.id, walletId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được voucher. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
