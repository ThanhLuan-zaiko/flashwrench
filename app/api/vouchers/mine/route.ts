import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { listMyWallets } from "@/lib/vouchers/voucher-wallet.service";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  try {
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const result = await listMyWallets(user.id, {
      cursor: request.nextUrl.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : undefined,
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
      { errors: { form: "Không tải được ví voucher. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
