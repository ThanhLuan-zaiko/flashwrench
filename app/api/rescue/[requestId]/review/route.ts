import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import {
  createRescueReview,
  getRescueReview,
} from "@/lib/reviews/rescue-review.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// Owner reads whether this completed rescue already has a review.
export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { requestId } = await params;
  try {
    const result = await getRescueReview(user, requestId);
    return resultResponse(result, (state) => ({ state }));
  } catch {
    return routeFailure("Không tải được đánh giá. Vui lòng thử lại sau.");
  }
}

// One review per completed rescue; targets the assigned mechanic.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { requestId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createRescueReview(user, requestId, body);
    return resultResponse(result, (review) => ({ review }), 201);
  } catch {
    return routeFailure("Không gửi được đánh giá. Vui lòng thử lại sau.");
  }
}
