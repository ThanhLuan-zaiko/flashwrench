import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { moderateReview } from "@/lib/reviews/review-moderation.service";

type RouteParams = { params: Promise<{ reviewId: string }> };

// Staff moderation: hide/unhide a public review row. Body carries the
// { targetType, targetId } of the feed the staff member is moderating.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("admin", "dispatcher");
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const { reviewId } = await params;
  try {
    const result = await moderateReview(user, reviewId, body);
    return resultResponse(result, (review) => ({ review }));
  } catch {
    return routeFailure("Không cập nhật được đánh giá. Vui lòng thử lại sau.");
  }
}
