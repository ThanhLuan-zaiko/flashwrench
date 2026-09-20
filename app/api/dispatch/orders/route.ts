import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listStaffOrders } from "@/lib/orders/orders.service";

// Dispatch order board feed: one status partition of one month bucket,
// paged via the signed cursor. Dispatcher and admin share this list.
export async function GET(request: Request) {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listStaffOrders({
      status: url.searchParams.get("status") ?? "pending",
      month: url.searchParams.get("month") ?? undefined,
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({
      items: result.data.items,
      nextCursor: result.data.nextCursor,
    });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được danh sách đơn. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}
