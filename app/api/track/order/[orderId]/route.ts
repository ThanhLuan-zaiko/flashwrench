import { NextResponse } from "next/server";
import { getPublicOrderTracking } from "@/lib/orders/order-track.service";

type RouteParams = { params: Promise<{ orderId: string }> };

// Public tracking for guest orders: guests never log in, so the
// unguessable order id acts as the capability. The payload carries
// only fulfilment progress — status, courier name, live pin while
// shipping — never customer identity fields.
export async function GET(_request: Request, { params }: RouteParams) {
  const { orderId } = await params;
  try {
    const result = await getPublicOrderTracking(orderId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ tracking: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được tiến trình đơn hàng. Vui lòng thử lại.",
        },
      },
      { status: 500 },
    );
  }
}
