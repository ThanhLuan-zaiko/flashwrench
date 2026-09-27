import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { collectCounterPayment } from "@/lib/orders/order-payment.service";
import {
  getOrderForStaff,
  updateOrderStatus,
} from "@/lib/orders/orders.service";
import type { CourierConfigInput } from "@/lib/orders/orders.types";
import { OPERATIONS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const { orderId } = await params;
    const result = await getOrderForStaff(orderId);
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

function toCourierInput(
  body: Record<string, unknown>,
): CourierConfigInput | undefined {
  if (!body.courier || typeof body.courier !== "object") return undefined;
  const courier = body.courier as Record<string, unknown>;
  return {
    type: String(courier.type ?? ""),
    mechanicId:
      courier.mechanicId === undefined ? undefined : String(courier.mechanicId),
    carrierName:
      courier.carrierName === undefined
        ? undefined
        : String(courier.carrierName),
    trackingCode:
      courier.trackingCode === undefined
        ? undefined
        : String(courier.trackingCode),
  };
}

// Staff actions: { action: "collect-payment" } settles a counter order at
// the till, otherwise { status, note?, courier? } drives the state machine
// (shipping needs a courier payload, refund is admin-only).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { user, response } = await requireRole("dispatcher", "admin");
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
    const { orderId } = await params;
    if (body.action === "collect-payment") {
      const collected = await collectCounterPayment(user.id, orderId);
      if (!collected.ok)
        return NextResponse.json(
          { errors: collected.errors },
          { status: collected.status },
        );
      void publishRealtimeEvent(OPERATIONS_TOPIC, {
        kind: "orders-updated",
        updatedAt: new Date().toISOString(),
      });
      if (collected.data.order.customerId) {
        void publishRealtimeEvent(userTopic(collected.data.order.customerId), {
          kind: "order-updated",
          orderId,
        });
      }
      return NextResponse.json({
        order: collected.data.order,
        payment: {
          providerRef: collected.data.providerRef,
          paidAt: collected.data.paidAt,
        },
      });
    }
    const result = await updateOrderStatus(
      { id: user.id, role: user.role },
      orderId,
      body.status,
      body.note === undefined ? undefined : String(body.note),
      toCourierInput(body),
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: "orders-updated",
      updatedAt: new Date().toISOString(),
    });
    if (result.data.customerId) {
      void publishRealtimeEvent(userTopic(result.data.customerId), {
        kind: "order-updated",
        orderId,
      });
    }
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
