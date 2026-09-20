import { requireRole } from "@/lib/auth/authorization";
import { listDispatchBookings } from "@/lib/dispatch/dispatch.service";
import { resultResponse, routeFailure } from "@/lib/http/workspace-route";

export async function GET(request: Request) {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listDispatchBookings(user, {
      status: url.searchParams.get("status") ?? undefined,
      month: url.searchParams.get("month") ?? undefined,
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
    });
    return resultResponse(result, (page) => ({
      items: page.items,
      nextCursor: page.nextCursor,
    }));
  } catch {
    return routeFailure("Không tải được danh sách đơn. Vui lòng thử lại sau.");
  }
}
