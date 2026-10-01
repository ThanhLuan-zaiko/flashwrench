import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { listMyThreads, openThreadForBooking } from "@/lib/chat/chat.service";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  try {
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const result = await listMyThreads(user, {
      cursor: request.nextUrl.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được hộp thư. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}

// Body: { bookingId } — opens (or reuses) the thread between the booking's
// customer and its assigned mechanic. The booking row authorizes the pair.
export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  let body: { bookingId?: unknown };
  try {
    body = (await request.json()) as { bookingId?: unknown };
  } catch {
    body = {};
  }
  if (typeof body.bookingId !== "string" || !body.bookingId.trim()) {
    return NextResponse.json(
      { errors: { bookingId: "Mã đơn hàng không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await openThreadForBooking(user, body.bookingId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không mở được cuộc trò chuyện. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
