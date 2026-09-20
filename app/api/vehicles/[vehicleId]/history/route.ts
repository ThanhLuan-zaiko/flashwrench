import { requireAuth } from "@/lib/auth/authorization";
import { resultResponse, routeFailure } from "@/lib/http/workspace-route";
import { listVehicleHistory } from "@/lib/vehicles/vehicle.service";

type RouteParams = { params: Promise<{ vehicleId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { vehicleId } = await params;
  const url = new URL(request.url);
  try {
    const result = await listVehicleHistory(user.id, vehicleId, {
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
    });
    return resultResponse(result, (page) => ({
      items: page.items,
      nextCursor: page.nextCursor,
    }));
  } catch {
    return routeFailure(
      "Không tải được lịch sử bảo dưỡng. Vui lòng thử lại sau.",
    );
  }
}
