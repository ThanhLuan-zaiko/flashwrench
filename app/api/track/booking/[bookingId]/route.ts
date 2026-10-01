import { NextResponse } from "next/server";
import { getPublicBookingTracking } from "@/lib/booking/booking-reader.service";

type RouteParams = { params: Promise<{ bookingId: string }> };

// Public tracking for guest bookings: guests never log in, so the
// unguessable booking id acts as the capability. The payload carries
// only journey progress — status, mechanic name, live pin — never
// customer identity fields.
export async function GET(_request: Request, { params }: RouteParams) {
  const { bookingId } = await params;
  try {
    const result = await getPublicBookingTracking(bookingId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ tracking: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được tiến trình đặt lịch. Vui lòng thử lại.",
        },
      },
      { status: 500 },
    );
  }
}
