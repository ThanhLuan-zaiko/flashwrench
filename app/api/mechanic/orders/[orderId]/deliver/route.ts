import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  routeFailure,
} from "@/lib/http/workspace-route";
import { collectOrderDelivery } from "@/lib/orders/order-collect.service";

type RouteParams = { params: Promise<{ orderId: string }> };

// Courier COD handover: the mechanic submits the code the customer dictated
// and the order settles to delivered+paid in one move. The code is echoed
// back to the customer only — never to the courier.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic", "admin");
  if (response) return response;
  const { orderId } = await params;
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await collectOrderDelivery(user, orderId, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ order: result.data });
  } catch {
    return routeFailure("Không ghi nhận được giao hàng. Vui lòng thử lại.");
  }
}
