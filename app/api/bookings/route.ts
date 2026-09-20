import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { createCustomerBooking } from "@/lib/booking/booking.service";
import type { CreateBookingInput } from "@/lib/booking/booking.types";
import { listCustomerBookings } from "@/lib/booking/customer-booking.service";
import {
  mutationOriginError,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { publishBookingChange } from "@/lib/realtime/domain-publish";

// Customer booking creation. Thin handler: parse input, call the service,
// shape the response, then fan the new-booking signal out over the
// gateway. Never CQL or business logic here.
export async function GET(request: Request) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listCustomerBookings(user.id, {
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
    });
    return resultResponse(result, (page) => ({
      items: page.items,
      nextCursor: page.nextCursor,
    }));
  } catch {
    return routeFailure(
      "Không tải được danh sách đơn hàng. Vui lòng thử lại sau.",
    );
  }
}

export async function POST(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  const input = body as CreateBookingInput;

  try {
    const result = await createCustomerBooking(user, {
      serviceId: input.serviceId ?? "",
      scheduledAt: input.scheduledAt ?? "",
      timeZone: input.timeZone,
      address: input.address ?? "",
      province: input.province,
      district: input.district,
      ward: input.ward,
      street: input.street,
      lat: input.lat,
      lng: input.lng,
      mechanicId: input.mechanicId,
      vehicleId: input.vehicleId,
      vehiclePlate: input.vehiclePlate ?? "",
      vehicleBrand: input.vehicleBrand,
      vehicleModel: input.vehicleModel,
      notes: input.notes,
    });

    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    const booking = result.data;
    // Signal only: subscribers refetch the real rows over HTTPS.
    // A preselected mechanic gets the job in their personal inbox, so
    // their queue updates without a reload; unassigned jobs stay on the
    // booking topic for the future dispatcher board.
    void publishBookingChange(
      "booking-created",
      booking.bookingId,
      booking.status,
      user.id,
      [booking.mechanicId],
    );
    if (booking.mechanicId) {
      void publishBookingChange(
        "booking-assigned",
        booking.bookingId,
        booking.status,
        user.id,
        [booking.mechanicId],
      );
    }
    return NextResponse.json({ booking }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được lịch hẹn. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
