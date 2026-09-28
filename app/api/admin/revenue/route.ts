import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { getAdminRevenue } from "@/lib/revenue/revenue.service";

// Admin revenue overview — everything the dispatcher gets, plus mechanic
// breakdown and fraud flags. ?range=day|week|month|year&anchor=YYYY-MM-DD.
export async function GET(request: Request) {
  const { response, user } = await requireRole("admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await getAdminRevenue(user, {
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
