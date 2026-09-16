import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  getNavigationBoard,
  saveMechanicLocation,
} from "@/lib/mechanic/mechanic-navigation.service";

const INVALID_JSON_MESSAGE = "Dữ liệu gửi lên không hợp lệ.";

// Origin (live GPS or garage base) plus every open job with coordinates.
export async function GET() {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  try {
    const result = await getNavigationBoard(user.id);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ board: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được bản đồ công việc. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}

// Save the GPS position shared from the mechanic phone:
// { latitude, longitude, currentJobId?, currentJobType? }.
export async function PATCH(request: Request) {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { errors: { form: INVALID_JSON_MESSAGE } },
      { status: 400 },
    );
  }

  try {
    const result = await saveMechanicLocation(user.id, {
      latitude: body.latitude,
      longitude: body.longitude,
      currentJobId: body.currentJobId,
      currentJobType: body.currentJobType,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ location: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không lưu được vị trí. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
