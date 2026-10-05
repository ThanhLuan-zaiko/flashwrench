import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getRedeemCodeForViewer } from "@/lib/vouchers/voucher-code.service";

// Per-viewer redeem-code visibility for the public campaign page: the
// code only leaves the server when this customer could still claim it.
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { user, response } = await requireRole("customer");
  if (response || !user) return response;
  const { slug } = await context.params;
  try {
    const result = await getRedeemCodeForViewer(user.id, slug);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được mã ưu đãi. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
