import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import {
  applyMechanicBookingAction,
  getMechanicBookingDetail,
} from "@/lib/mechanic/mechanic-bookings.service";
import { publishBookingChange } from "@/lib/realtime/domain-publish";

type RouteParams = { params: Promise<{ bookingId: string }> };

const INVALID_JSON_MESSAGE = "Dữ liệu gửi lên không hợp lệ.";

// One booking with line items and its tracking timeline.
export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  const { bookingId } = await params;
  try {
    const result = await getMechanicBookingDetail(user.id, bookingId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ booking: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được chi tiết đơn. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}

// Run one workflow action: { action, note? }. The service moves the booking
// to the next state; the route then tells the customer side in realtime.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  const { bookingId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: INVALID_JSON_MESSAGE } },
      { status: 400 },
    );
  }

  try {
    const result = await applyMechanicBookingAction(
      user.id,
      bookingId,
      body.action,
      body.note,
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishBookingChange(
      "booking-updated",
      bookingId,
      result.data.booking.status,
      result.data.customerId,
      [result.data.previousMechanicId, result.data.nextMechanicId],
    );
    return NextResponse.json({ booking: result.data.booking });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không cập nhật được đơn. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
