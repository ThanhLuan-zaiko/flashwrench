import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDispatchCustomerMix } from "@/lib/customer-mix/customer-mix.service";
import { routeFailure } from "@/lib/http/workspace-route";

// Dispatcher member-vs-guest overview: ?range=day|week|month&anchor=YYYY-MM-DD.
export async function GET(request: Request) {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await getDispatchCustomerMix({
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
    return routeFailure("Không tải được báo cáo khách hàng.");
  }
}
