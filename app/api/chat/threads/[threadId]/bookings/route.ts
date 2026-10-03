import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { getThreadBookings } from "@/lib/chat/chat-booking.service";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  try {
    const result = await getThreadBookings(user, threadId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ items: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được đơn liên quan. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
