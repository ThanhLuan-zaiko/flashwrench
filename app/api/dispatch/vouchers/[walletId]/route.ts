import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { publishWalletChange } from "@/lib/vouchers/voucher-realtime";
import { revokeWallet } from "@/lib/vouchers/voucher-wallet.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ walletId: string }> },
) {
  const { user, response } = await requireRole("dispatcher", "admin");
  if (response || !user) return response;
  const { walletId } = await context.params;
  let note = "";
  try {
    const body = ((await request.json()) as Record<string, unknown>) ?? {};
    note = typeof body.note === "string" ? body.note : "";
  } catch {
    note = "";
  }
  try {
    const result = await revokeWallet(
      { id: user.id, role: user.role },
      walletId,
      note,
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishWalletChange({
      kind: "voucher-revoked",
      walletId: result.data.id,
      userId: result.data.userId,
    });
    return NextResponse.json({ wallet: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không thu hồi được voucher." } },
      { status: 500 },
    );
  }
}
