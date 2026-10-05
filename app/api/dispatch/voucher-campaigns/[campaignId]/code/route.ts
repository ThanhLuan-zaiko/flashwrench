import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { publishCampaignChange } from "@/lib/vouchers/voucher-realtime";
import { setCampaignRedeemCode } from "@/lib/vouchers/voucher-redeem-code.service";

// Dispatchers (and admins) manage ONLY the typed redeem code here; the
// rest of the campaign is still admin-editable only. An empty or missing
// redeemCode clears the code.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireRole("dispatcher", "admin");
  if (response || !user) return response;
  const { campaignId } = await params;
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
    const result = await setCampaignRedeemCode(
      campaignId,
      String(body.redeemCode ?? ""),
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishCampaignChange(campaignId);
    return NextResponse.json({ campaign: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không cập nhật được mã nhập tay." } },
      { status: 500 },
    );
  }
}
