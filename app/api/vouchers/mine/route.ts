import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { listMyWallets } from "@/lib/vouchers/voucher-wallet.service";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  try {
    const result = await listMyWallets(user.id);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ wallets: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được ví voucher. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
