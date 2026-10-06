import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { requestOrderReturn } from "@/lib/orders/order-return.service";
import { cancelMyOrder } from "@/lib/orders/orders.service";
import { getMyOrder } from "@/lib/orders/orders-read.service";
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

// Customer actions on their own order: "cancel" while pending, or
// "request-return" {reason, images[]} on a delivered order inside the
// 3-day window. Guards live in the services.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = (await readJsonObject(request)) ?? {};
  try {
    const { orderId } = await params;
    const result =
      body.action === "cancel"
        ? await cancelMyOrder(user.id, orderId)
        : body.action === "request-return"
          ? await requestOrderReturn(user.id, orderId, {
              reason: body.reason,
              images: body.images,
            })
          : null;
    if (!result) {
      return NextResponse.json(
        { errors: { form: "Hành động không hợp lệ." } },
        { status: 400 },
      );
    }
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
      {
        errors: { form: "Không cập nhật được đơn hàng. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}
