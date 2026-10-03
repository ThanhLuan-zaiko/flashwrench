import { NextResponse } from "next/server";
import { listPublicCampaigns } from "@/lib/vouchers/voucher-public.service";

// Public feed for customer advertising. No login required so guests can
// see running promotions; only active, non-deleted, in-window campaigns
// with remaining slots are returned.
export async function GET() {
  try {
    const result = await listPublicCampaigns();
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ campaigns: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được ưu đãi. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
