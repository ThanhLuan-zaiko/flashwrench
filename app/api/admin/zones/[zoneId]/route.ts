import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { updateZone } from "@/lib/zones/zone.service";

type RouteParams = { params: Promise<{ zoneId: string }> };

// Admin zone edit: rename, move the center, resize, toggle active.
// No delete: history rows reference zones, so deactivation retires them.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("admin");
  if (response) return response;
  const { zoneId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  try {
    const result = await updateZone(user, zoneId, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không cập nhật được khu vực. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
