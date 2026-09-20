import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { cancelMyOrder, getMyOrder } from "@/lib/orders/orders.service";
import { OPERATIONS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  try {
    const { orderId } = await params;
    const result = await getMyOrder(user.id, orderId);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ order: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được đơn hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}

// Customer actions on their own order. v1 supports "cancel" only, and only
// while the order is still pending (service enforces the guard).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = (await readJsonObject(request)) ?? {};
  if (body.action !== "cancel") {
    return NextResponse.json(
      { errors: { form: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const { orderId } = await params;
    const result = await cancelMyOrder(user.id, orderId);
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
      orderId,
    });
    return NextResponse.json({ order: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không hủy được đơn hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
