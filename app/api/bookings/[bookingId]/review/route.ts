import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { createBookingReview } from "@/lib/booking/review.service";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { bookingId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createBookingReview(user, bookingId, body);
    return resultResponse(result, (review) => ({ review }), 201);
  } catch {
    return routeFailure("Không gửi được đánh giá. Vui lòng thử lại sau.");
  }
}
