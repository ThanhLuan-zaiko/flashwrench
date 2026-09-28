import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import {
  createOrderReview,
  getOrderReviews,
} from "@/lib/reviews/order-review.service";

type RouteParams = { params: Promise<{ orderId: string }> };

// Order review state for the owner: overall review plus one per part.
export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { orderId } = await params;
  try {
    const result = await getOrderReviews(user, orderId);
    return resultResponse(result, (state) => ({ state }));
  } catch {
    return routeFailure("Không tải được đánh giá. Vui lòng thử lại sau.");
  }
}

// Overall purchase-experience review (one per delivered order).
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { orderId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createOrderReview(user, orderId, body);
    return resultResponse(result, (review) => ({ review }), 201);
  } catch {
    return routeFailure("Không gửi được đánh giá. Vui lòng thử lại sau.");
  }
}
