import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { createVehicle, listVehicles } from "@/lib/vehicles/vehicle.service";

export async function GET(request: Request) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listVehicles(user.id, {
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
    });
    return resultResponse(result, (page) => ({
      items: page.items,
      nextCursor: page.nextCursor,
    }));
  } catch {
    return routeFailure("Không tải được danh sách xe. Vui lòng thử lại sau.");
  }
}

export async function POST(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createVehicle(user, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishRealtimeEvent(userTopic(user.id), {
      kind: "vehicle-updated",
    });
    return NextResponse.json({ vehicle: result.data }, { status: 201 });
  } catch {
    return routeFailure("Không lưu được xe. Vui lòng thử lại sau.");
  }
}
