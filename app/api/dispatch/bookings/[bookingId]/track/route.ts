import { requireRole } from "@/lib/auth/authorization";
import { getDispatchBookingTrack } from "@/lib/dispatch/dispatch-tracking.service";
import { resultResponse, routeFailure } from "@/lib/http/workspace-route";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const { bookingId } = await params;
  try {
    const result = await getDispatchBookingTrack(user, bookingId);
    return resultResponse(result, (points) => ({ points }));
  } catch {
    return routeFailure("Không tải được lộ trình. Vui lòng thử lại sau.");
  }
}
