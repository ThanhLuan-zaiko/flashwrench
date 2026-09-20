import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { checkoutCart } from "@/lib/orders/checkout.service";
import { listMyOrders } from "@/lib/orders/orders.service";
import type { CheckoutInput } from "@/lib/orders/orders.types";
import { OPERATIONS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

// My orders: customers list and read their own purchases only.
export async function GET() {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  try {
    const result = await listMyOrders(user.id);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ orders: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được đơn hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}

function toCheckoutInput(body: Record<string, unknown>): CheckoutInput {
  return {
    recipientName: String(body.recipientName ?? ""),
    phone: String(body.phone ?? ""),
    address: String(body.address ?? ""),
    note: body.note === undefined ? undefined : String(body.note),
  };
}

// Checkout: cart -> pending order + COD payment, stock decremented with
// CAS. The operations topic notifies the dispatch board and the customer
// topic refreshes their own orders list.
export async function POST(request: Request) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await checkoutCart(user.id, toCheckoutInput(body));
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: "orders-updated",
      updatedAt: new Date().toISOString(),
    });
    void publishRealtimeEvent(userTopic(user.id), {
      kind: "order-updated",
      orderId: result.data.id,
    });
    return NextResponse.json({ order: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không đặt được đơn hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
