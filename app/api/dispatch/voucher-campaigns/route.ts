import { requireRole } from "@/lib/auth/authorization";
import { listCampaigns } from "@/lib/vouchers/voucher-campaign.service";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const result = await listCampaigns();
    if (!result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: result.status });
    }
    return NextResponse.json({
      campaigns: result.data.filter((item) => item.isActive),
    });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được chiến dịch." } },
      { status: 500 },
    );
  }
}
