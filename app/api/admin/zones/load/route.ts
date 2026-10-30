import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";
import { getZoneLoad } from "@/lib/zones/zone-load.service";

// Open rescues per service zone for the admin rescue chart.
export async function GET() {
  const { response, user } = await requireRole("admin");
  if (response) return response;
  try {
    const result = await getZoneLoad(user);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return routeFailure("Không tải được tải cứu hộ theo vùng.");
  }
}
