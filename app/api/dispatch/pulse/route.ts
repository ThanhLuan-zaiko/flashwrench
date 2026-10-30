import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getDispatchPulse } from "@/lib/dispatch/dispatch-pulse.service";
import { routeFailure } from "@/lib/http/workspace-route";

// Live operations pulse for the dispatch board header.
export async function GET() {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const result = await getDispatchPulse(user);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return routeFailure("Không tải được nhịp vận hành.");
  }
}
