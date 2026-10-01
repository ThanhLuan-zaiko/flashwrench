import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { publishWalletChange } from "@/lib/vouchers/voucher-realtime";
import { grantWallet } from "@/lib/vouchers/voucher-wallet.service";

export async function POST(request: Request) {
  const { user, response } = await requireRole("dispatcher", "admin");
  if (response || !user) return response;
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
    const result = await grantWallet(
      { id: user.id, role: user.role },
      {
        campaignId: String(body.campaignId ?? ""),
        userId: String(body.userId ?? ""),
        note: body.note === undefined ? "" : String(body.note),
        expiresAt:
          body.expiresAt === undefined ? undefined : String(body.expiresAt),
      },
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishWalletChange({
      kind: "voucher-granted",
      walletId: result.data.id,
      userId: result.data.userId,
    });
    return NextResponse.json({ wallet: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không phát được voucher. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
