import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { listMechanicReviews } from "@/lib/reviews/target-reviews.service";

type RouteParams = { params: Promise<{ mechanicId: string }> };

// Public mechanic reviews: booking + rescue reviews aggregated under
// the mechanic target, newest first with a signed cursor. A staff
// session also returns hidden rows (flagged) for moderation.
export async function GET(request: Request, { params }: RouteParams) {
  const { mechanicId } = await params;
  const user = await authenticateRequest();
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const result = await listMechanicReviews(mechanicId, cursor, user);
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
