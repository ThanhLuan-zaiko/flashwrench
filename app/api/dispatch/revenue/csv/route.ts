import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { getDispatchRevenue } from "@/lib/revenue/revenue.service";
import { buildRevenueCsv, revenueCsvFilename } from "@/lib/revenue/revenue-csv";

// CSV export of the same transactions table the dashboard shows. Staff-only
// columns are omitted — dispatchers get amounts, not accountability data.
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
    return new NextResponse(buildRevenueCsv(result.data, false), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${revenueCsvFilename(result.data)}"`,
      },
    });
  } catch {
    return routeFailure("Không xuất được báo cáo. Vui lòng thử lại sau.");
  }
}
