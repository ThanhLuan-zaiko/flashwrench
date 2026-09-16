import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { createCustomerBooking } from "@/lib/booking/booking.service";
import type { CreateBookingInput } from "@/lib/booking/booking.types";

// Customer booking creation. Thin handler: parse input, call the service,
// shape the response. Never CQL or business logic here.
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
      address: input.address ?? "",
      province: input.province,
      district: input.district,
      ward: input.ward,
      street: input.street,
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
    return NextResponse.json({ booking: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được lịch hẹn. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
