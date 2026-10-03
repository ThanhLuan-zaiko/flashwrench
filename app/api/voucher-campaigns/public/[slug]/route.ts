import { NextResponse } from "next/server";
import { getPublicCampaignBySlug } from "@/lib/vouchers/voucher-public.service";

// Public campaign detail for /vouchers/c/[slug]. Guests can read it;
// hidden or finished campaigns return 404 like a missing promotion.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const result = await getPublicCampaignBySlug(slug);
    if (!result.ok) {
      return NextResponse.json(
        {
          errors: {
            form:
              result.status === 404
                ? "Ưu đãi không tồn tại hoặc đã kết thúc."
                : "Không tải được ưu đãi. Vui lòng thử lại sau.",
          },
        },
        { status: result.status },
      );
    }
    return NextResponse.json({ campaign: result.data });
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
