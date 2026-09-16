import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { createCustomerBooking } from "@/lib/booking/booking.service";
import type { CreateBookingInput } from "@/lib/booking/booking.types";
import {
  BOOKING_ASSIGNED_EVENT_KIND,
  BOOKING_CREATED_EVENT_KIND,
  bookingTopic,
  userTopic,
} from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

// Customer booking creation. Thin handler: parse input, call the service,
// shape the response, then fan the new-booking signal out over the
// gateway. Never CQL or business logic here.
export async function POST(request: Request) {
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
    const signal = {
      bookingId: booking.bookingId,
      status: booking.status,
    };
    // Signal only: subscribers refetch the real rows over HTTPS.
    // A preselected mechanic gets the job in their personal inbox, so
    // their queue updates without a reload; unassigned jobs stay on the
    // booking topic for the future dispatcher board.
    void publishRealtimeEvent(bookingTopic(booking.bookingId), {
      kind: BOOKING_CREATED_EVENT_KIND,
      ...signal,
    });
    if (booking.mechanicId) {
      void publishRealtimeEvent(userTopic(booking.mechanicId), {
        kind: BOOKING_ASSIGNED_EVENT_KIND,
        ...signal,
      });
    }
    return NextResponse.json({ booking }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được lịch hẹn. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
