import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listClaimableCodeCampaigns } from "@/lib/vouchers/voucher-claimable.service";

// Claimable typed codes for the picker: campaigns with a redeem code
// this customer could still claim for the given order kind.
export async function GET(request: NextRequest) {
  const { user, response } = await requireRole("customer");
  if (response || !user) return response;
  const kindParam = request.nextUrl.searchParams.get("kind");
  // Optional scope filter: absent means "all coded campaigns" (the
  // /vouchers shelf shows codes regardless of order kind).
  const kind = kindParam === null || kindParam === "" ? null : kindParam;
  if (kind !== null && kind !== "booking" && kind !== "order") {
    return NextResponse.json(
      { errors: { form: "Loại đơn không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await listClaimableCodeCampaigns(user.id, kind);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ items: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được ưu đãi. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
