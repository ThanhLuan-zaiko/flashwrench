import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { getCustomerStatsSnapshot } from "@/lib/vouchers/customer-stats.service";

// Customer-facing rollup for the "almost there" progress UI on /vouchers.
// Any signed-in account gets its own row — staff accounts simply have no
// activity, so they read zeros like a fresh customer.
export async function GET() {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  try {
    const stats = await getCustomerStatsSnapshot(user.id);
    return NextResponse.json({
      bookings: stats.completed_bookings ?? 0,
      orders: stats.completed_orders ?? 0,
      spent: stats.total_spent ?? 0,
      lastActivityAt: stats.last_activity_at?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được tiến độ. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
