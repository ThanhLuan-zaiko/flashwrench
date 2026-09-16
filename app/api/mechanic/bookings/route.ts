import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";
import {
  listMechanicBookings,
  MECHANIC_BOOKING_LIMIT,
} from "@/lib/mechanic/mechanic-bookings.service";
import { isMechanicBookingStatus } from "@/lib/mechanic/mechanic-status";

const UNKNOWN_STATE_MESSAGE = "Trạng thái lọc không hợp lệ.";

// Mechanic workload, newest schedule first. ?status= one of the workflow
// statuses, ?limit= caps how many bookings the list resolves.
export async function GET(request: Request) {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  const params = new URL(request.url).searchParams;
  const rawStatus = params.get("status");

  let status: MechanicBookingStatus | "all" = "all";
  if (rawStatus && rawStatus !== "all") {
    if (!isMechanicBookingStatus(rawStatus)) {
      return NextResponse.json(
        { errors: { form: UNKNOWN_STATE_MESSAGE } },
        { status: 400 },
      );
    }
    status = rawStatus;
  }

  try {
    const result = await listMechanicBookings(user.id, {
      status,
      limit: Number(params.get("limit") ?? MECHANIC_BOOKING_LIMIT),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ bookings: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được lịch làm việc. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}
