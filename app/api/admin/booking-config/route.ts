import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  getBookingConfig,
  updateBookingConfig,
} from "@/lib/booking/booking-config.service";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { BOOKING_CONFIG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

// Admin booking intake tuning. GET returns the live values or the code
// defaults when never saved; PATCH validates the three bounded knobs
// (lead floor, advance cap, cancel cutoff) and returns field errors.
export async function GET() {
  const { response } = await requireRole("admin");
  if (response) return response;
  try {
    const config = await getBookingConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được cấu hình. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("admin");
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  try {
    const result = await updateBookingConfig(user, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    // Fan the retune out to every open booking form and admin tab; the
    // payload is only a refresh signal, the value refetches over HTTPS.
    void publishRealtimeEvent(BOOKING_CONFIG_TOPIC, {
      kind: "config-updated",
      updatedAt: result.data.config.updatedAt,
    });
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không lưu được cấu hình. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
