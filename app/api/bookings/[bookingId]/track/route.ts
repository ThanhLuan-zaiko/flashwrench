import { requireAuth } from "@/lib/auth/authorization";
import { getCustomerBookingTrack } from "@/lib/booking/customer-booking.service";
import { resultResponse, routeFailure } from "@/lib/http/workspace-route";

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { bookingId } = await params;
  try {
    const result = await getCustomerBookingTrack(user.id, bookingId);
    return resultResponse(result, (points) => ({ points }));
  } catch {
    return routeFailure("Không tải được lộ trình. Vui lòng thử lại sau.");
  }
}
