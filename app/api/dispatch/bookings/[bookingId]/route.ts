import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  applyDispatchAction,
  getDispatchBooking,
} from "@/lib/dispatch/dispatch.service";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const { bookingId } = await params;
  try {
    const result = await getDispatchBooking(user, bookingId);
    return resultResponse(result, (booking) => ({ booking }));
  } catch {
    return routeFailure("Không tải được chi tiết đơn. Vui lòng thử lại sau.");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("dispatcher", "admin");
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
    const result = await applyDispatchAction(user, bookingId, body);
    return resultResponse(result, (booking) => ({ booking }));
  } catch {
    return routeFailure("Không cập nhật được đơn hàng. Vui lòng thử lại sau.");
  }
}
