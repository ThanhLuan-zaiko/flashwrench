import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { getDispatchRevenue } from "@/lib/revenue/revenue.service";

// Dispatcher revenue overview: ?range=day|week|month|year&anchor=YYYY-MM-DD.
export async function GET(request: Request) {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await getDispatchRevenue(user, {
      range: url.searchParams.get("range"),
      anchor: url.searchParams.get("anchor"),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return routeFailure("Không tải được báo cáo doanh thu.");
  }
}
