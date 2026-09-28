import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { createOrderPartReview } from "@/lib/reviews/order-review.service";

type RouteParams = { params: Promise<{ orderId: string; partId: string }> };

// One review per purchased part inside a delivered order; the review
// feeds the public product rating on /products/[slug].
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { orderId, partId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createOrderPartReview(user, orderId, partId, body);
    return resultResponse(result, (review) => ({ review }), 201);
  } catch {
    return routeFailure("Không gửi được đánh giá. Vui lòng thử lại sau.");
  }
}
