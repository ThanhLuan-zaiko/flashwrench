import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { listPartReviews } from "@/lib/reviews/target-reviews.service";

type RouteParams = { params: Promise<{ slug: string }> };

// Public product reviews with rating summary; cursor-paginated. A staff
// session also returns hidden rows (flagged) for moderation.
export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const user = await authenticateRequest();
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const result = await listPartReviews(slug, cursor, user);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ reviews: result.data });
  } catch {
    return routeFailure("Không tải được đánh giá. Vui lòng thử lại sau.");
  }
}
