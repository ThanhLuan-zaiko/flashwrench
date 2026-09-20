import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { recordBookingPayment } from "@/lib/payments/booking-payment.service";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic", "admin");
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
    const result = await recordBookingPayment(user, bookingId, body);
    return resultResponse(result, (payment) => ({ payment }), 201);
  } catch {
    return routeFailure(
      "Không ghi nhận được thanh toán. Vui lòng thử lại sau.",
    );
  }
}
