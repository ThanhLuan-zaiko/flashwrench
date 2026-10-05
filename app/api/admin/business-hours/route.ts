import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { BUSINESS_HOURS_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import {
  getBusinessHoursConfig,
  updateBusinessHours,
} from "@/lib/shop/business-hours.service";

// Admin working-hours window. GET returns the live values or the code
// defaults when never saved; PATCH validates the toggle plus the
// minutes-of-day range and returns field errors.
export async function GET() {
  const { response } = await requireRole("admin");
  if (response) return response;
  try {
    const hours = await getBusinessHoursConfig();
    return NextResponse.json({ hours });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được giờ làm việc. Vui lòng thử lại." },
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
    const result = await updateBusinessHours(user, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    // Fan the retune out to every open booking form and admin tab; the
    // payload is only a refresh signal, the value refetches over HTTPS.
    void publishRealtimeEvent(BUSINESS_HOURS_TOPIC, {
      kind: "config-updated",
      updatedAt: result.data.hours.updatedAt,
    });
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không lưu được giờ làm việc. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
