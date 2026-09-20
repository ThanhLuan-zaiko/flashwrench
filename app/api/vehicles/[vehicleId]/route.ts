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
import {
  getVehicle,
  setVehicleArchived,
  updateVehicleDetails,
} from "@/lib/vehicles/vehicle.service";

type RouteParams = { params: Promise<{ vehicleId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { vehicleId } = await params;
  try {
    const result = await getVehicle(user.id, vehicleId);
    return resultResponse(result, (vehicle) => ({ vehicle }));
  } catch {
    return routeFailure("Không tải được xe. Vui lòng thử lại sau.");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { vehicleId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result =
      body.action === "restore"
        ? await setVehicleArchived(user.id, vehicleId, false)
        : body.action === "archive"
          ? await setVehicleArchived(user.id, vehicleId, true)
          : await updateVehicleDetails(user.id, vehicleId, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishRealtimeEvent(userTopic(user.id), {
      kind: "vehicle-updated",
    });
    return NextResponse.json({ vehicle: result.data });
  } catch {
    return routeFailure("Không cập nhật được xe. Vui lòng thử lại sau.");
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireAuth();
  if (response) return response;
  const { vehicleId } = await params;
  try {
    const result = await setVehicleArchived(user.id, vehicleId, true);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishRealtimeEvent(userTopic(user.id), {
      kind: "vehicle-updated",
    });
    return NextResponse.json({ vehicle: result.data });
  } catch {
    return routeFailure("Không lưu trữ được xe. Vui lòng thử lại sau.");
  }
}
