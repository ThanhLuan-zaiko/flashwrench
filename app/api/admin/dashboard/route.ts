import { NextResponse } from "next/server";
import { getAdminDashboard } from "@/lib/admin/admin-dashboard.service";
import { requireRole } from "@/lib/auth/authorization";
import { routeFailure } from "@/lib/http/workspace-route";

// One-shot dashboard counters + audit feed for the admin landing screen.
export async function GET() {
  const { response, user } = await requireRole("admin");
  if (response) return response;
  try {
    const result = await getAdminDashboard(user);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return routeFailure("Không tải được số liệu tổng quan.");
  }
}
