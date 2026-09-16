import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getMechanicStats } from "@/lib/mechanic/mechanic-stats.service";

// Completion counts, monthly series, rating buckets and latest reviews.
export async function GET() {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  try {
    const result = await getMechanicStats(user.id);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({
      stats: result.data.stats,
      monthly: result.data.monthly,
      ratings: result.data.ratings,
      reviews: result.data.reviews,
    });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được thống kê. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
