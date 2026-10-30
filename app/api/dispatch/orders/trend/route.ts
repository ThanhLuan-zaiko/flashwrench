import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { getOrderTrend } from "@/lib/orders/orders-trend.service";

// Orders and value per day over the last two weeks (dispatch + admin).
export async function GET() {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const result = await getOrderTrend(user);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return routeFailure("Không tải được thống kê đơn hàng.");
  }
}
