import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  cancelCustomerBooking,
  getCustomerBooking,
} from "@/lib/booking/customer-booking.service";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { bookingId } = await params;
  try {
    const result = await getCustomerBooking(user.id, bookingId);
    return resultResponse(result, (booking) => ({ booking }));
  } catch {
    return routeFailure("Không tải được chi tiết đơn. Vui lòng thử lại sau.");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { bookingId } = await params;

  const body = await readJsonObject(request);
  if (!body || body.action !== "cancel") {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await cancelCustomerBooking(user.id, bookingId, body.note);
    return resultResponse(result, (booking) => ({ booking }));
  } catch {
    return routeFailure("Không hủy được đơn hàng. Vui lòng thử lại sau.");
  }
}
