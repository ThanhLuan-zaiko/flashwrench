import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { listServiceReviews } from "@/lib/reviews/target-reviews.service";

type RouteParams = { params: Promise<{ serviceId: string }> };

// Public service reviews: the service part of completed booking reviews,
// newest first with a signed cursor and a rating summary. A staff
// session also returns hidden rows (flagged) for moderation.
export async function GET(request: Request, { params }: RouteParams) {
  const { serviceId } = await params;
  const user = await authenticateRequest();
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const result = await listServiceReviews(serviceId, cursor, user);
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
