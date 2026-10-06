import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { resolveShopper, staleSessionResponse } from "@/lib/auth/shopper";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { notifyOrderCreated } from "@/lib/mail/confirmation.service";
import { checkoutCart, checkoutGuestCart } from "@/lib/orders/checkout.service";
import type { CheckoutInput } from "@/lib/orders/orders.types";
import { listMyOrders } from "@/lib/orders/orders-read.service";
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

function toNumberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCheckoutInput(body: Record<string, unknown>): CheckoutInput {
  return {
    recipientName: String(body.recipientName ?? ""),
    phone: String(body.phone ?? ""),
    email: body.email === undefined ? undefined : String(body.email),
    fulfillment: String(body.fulfillment ?? ""),
    address: String(body.address ?? ""),
    addressLat: toNumberOrNull(body.addressLat),
    addressLng: toNumberOrNull(body.addressLng),
    province: String(body.province ?? ""),
    district: String(body.district ?? ""),
    ward: String(body.ward ?? ""),
    street: String(body.street ?? ""),
    note: body.note === undefined ? undefined : String(body.note),
    paymentMethod:
      body.paymentMethod === undefined ? undefined : String(body.paymentMethod),
    walletId:
      body.walletId === undefined || body.walletId === null
        ? undefined
        : String(body.walletId),
  };
}

// Checkout: cart -> pending order + payment row for the chosen method
// (cod / counter / mock bank_transfer), stock decremented with CAS. The
// operations topic notifies the dispatch board and the customer topic
// refreshes their own orders list. Guests check out against their fw_gid
// cart partition and must leave name + phone + email on the order.
export async function POST(request: Request) {
  const shopper = await resolveShopper();
  // A killed session must not fall through to the guest partition: 401
  // lets the client refresh and retry the checkout under the account.
  if (shopper.staleAccessToken) return staleSessionResponse();
  if (shopper.user && shopper.user.role !== "customer") {
    return NextResponse.json(
      { errors: { form: "Bạn không có quyền thực hiện thao tác này." } },
      { status: 403 },
    );
  }
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  if (!shopper.cartId) {
    return NextResponse.json(
      { errors: { form: "Giỏ hàng đang trống. Hãy chọn sản phẩm trước." } },
      { status: 400 },
    );
  }
  try {
    const input = toCheckoutInput(body);
    const result = shopper.user
      ? await checkoutCart(shopper.cartId, input, shopper.user.email)
      : await checkoutGuestCart(shopper.cartId, input);
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: "orders-updated",
      updatedAt: new Date().toISOString(),
    });
    if (shopper.user) {
      void publishRealtimeEvent(userTopic(shopper.user.id), {
        kind: "order-updated",
        orderId: result.data.id,
      });
    }
    // Courtesy copy of the tracking link: fire-and-forget, a mail outage
    // must never fail a checkout that already persisted.
    notifyOrderCreated(result.data);
    return NextResponse.json({ order: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không đặt được đơn hàng. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
