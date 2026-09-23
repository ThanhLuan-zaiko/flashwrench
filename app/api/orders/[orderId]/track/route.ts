import { requireAuth } from "@/lib/auth/authorization";
import { resultResponse, routeFailure } from "@/lib/http/workspace-route";
import { getMyOrderTrack } from "@/lib/orders/order-track.service";

type RouteParams = { params: Promise<{ orderId: string }> };

// Customer delivery tracking: destination pin, courier breadcrumbs and
// the courier's live position while a mechanic carries the order.
export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { orderId } = await params;
  try {
    const result = await getMyOrderTrack(user.id, orderId);
    return resultResponse(result, (track) => ({ track }));
  } catch {
    return routeFailure(
      "Không tải được lộ trình giao hàng. Vui lòng thử lại sau.",
    );
  }
}
