import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { payOrderOnlineMock } from "@/lib/orders/order-payment.service";
import { publishOrderChange } from "@/lib/realtime/domain-publish";

// Simulated online payment: customers settle their own order via
// { action: "pay" }. The gateway is a mock — success is immediate and the
// payment carries a MOCK-* provider ref. Counter payments are collected by
// staff through the dispatch route instead.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = await readJsonObject(request);
  if (body?.action !== "pay") {
    return NextResponse.json(
      { errors: { form: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const { orderId } = await params;
    const result = await payOrderOnlineMock(user.id, orderId);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishOrderChange(orderId, result.data.order.status, user.id);
    return NextResponse.json({
      order: result.data.order,
      payment: {
        providerRef: result.data.providerRef,
        paidAt: result.data.paidAt,
      },
    });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không thanh toán được đơn hàng. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
