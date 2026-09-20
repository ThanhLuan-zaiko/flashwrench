import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import {
  getOrderForStaff,
  updateOrderStatus,
} from "@/lib/orders/orders.service";
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

// Staff status transition { status, note? }. The state machine in the
// service guards the move; refund additionally requires the admin role.
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
    const result = await updateOrderStatus(
      { id: user.id, role: user.role },
      orderId,
      body.status,
      body.note === undefined ? undefined : String(body.note),
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
    void publishRealtimeEvent(userTopic(result.data.customerId), {
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
