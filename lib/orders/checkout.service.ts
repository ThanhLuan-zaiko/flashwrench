import { randomUUID } from "node:crypto";
import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validatePhone,
} from "@/lib/auth/validation";
import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { resolveOrderPaymentMethod } from "@/lib/payments/order-payment.types";
import { clearCartRows, listCartRows } from "./cart.repository";
import { reserveOrderLines } from "./order-lines.service";
import { orderShippingFee } from "./order-pricing";
import { toOrderDetail } from "./orders.mapper";
import {
  findOrderRowById,
  listOrderHistoryRows,
  listOrderItemRows,
} from "./orders.repository";
import {
  type CheckoutInput,
  isFulfillmentType,
  type OrderDetail,
  type OrderFieldErrors,
  type OrdersResult,
} from "./orders.types";
import { insertOrder } from "./orders-write.repository";

export {
  FREE_SHIPPING_THRESHOLD,
  ORDER_SHIPPING_FEE,
} from "./order-pricing";

export const ORDER_ADDRESS_MIN = 10;
export const ORDER_ADDRESS_MAX = 300;
export const ORDER_NOTE_MAX = 500;

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}

export function validateCheckoutInput(
  input: CheckoutInput,
  options?: { guest?: boolean },
): OrderFieldErrors | null {
  const errors: OrderFieldErrors = {};
  const name = input.recipientName.trim().replace(/\s+/g, " ");
  if (!name) errors.recipientName = "Vui lòng nhập tên người nhận.";
  else if (name.length < 2 || name.length > 100)
    errors.recipientName = "Tên người nhận phải từ 2 đến 100 ký tự.";
  const phoneError = validatePhone(input.phone);
  if (phoneError) errors.phone = phoneError;
  // Guests must leave an email so staff can reach them when the phone
  // fails; signed-in customers reuse the verified account email instead.
  if (options?.guest) {
    const emailError = validateEmail(input.email ?? "");
    if (emailError) errors.email = emailError;
  }
  if (!isFulfillmentType(input.fulfillment)) {
    errors.fulfillment = "Vui lòng chọn hình thức nhận hàng.";
  } else {
    if (input.fulfillment === "delivery") {
      const address = input.address.trim();
      if (!address) errors.address = "Vui lòng nhập địa chỉ nhận hàng.";
      else if (
        address.length < ORDER_ADDRESS_MIN ||
        address.length > ORDER_ADDRESS_MAX
      )
        errors.address = `Địa chỉ phải từ ${ORDER_ADDRESS_MIN} đến ${ORDER_ADDRESS_MAX} ký tự.`;
      if (
        !isValidLatitude(input.addressLat) ||
        !isValidLongitude(input.addressLng)
      ) {
        errors.address =
          errors.address ?? "Vui lòng ghim vị trí giao hàng trên bản đồ.";
      }
    }
    if (
      resolveOrderPaymentMethod(input.fulfillment, input.paymentMethod) === null
    ) {
      errors.paymentMethod =
        "Phương thức thanh toán không hợp lệ cho hình thức nhận hàng này.";
    }
  }
  if (input.note !== undefined && input.note.length > ORDER_NOTE_MAX) {
    errors.note = `Ghi chú tối đa ${ORDER_NOTE_MAX} ký tự.`;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

// Who the cart partition and the order belong to. Guests own the
// partition named by their fw_gid token; the order itself gets
// customer_id null plus the contact trio (name/phone/email) from the
// form — never a user row, matching the walk-in counter-sale shape.
export type CheckoutActor = {
  cartId: string;
  customerId: string | null;
  accountEmail: string | null;
};

// Checkout turns the cart into an order at live prices: lines are
// reserved against real stock (see reserveOrderLines), pickup orders
// skip the address + shipping fee, and delivery orders carry the map
// coordinates the courier will navigate to.
async function runCheckout(
  actor: CheckoutActor,
  raw: CheckoutInput,
): Promise<OrdersResult<OrderDetail>> {
  const guest = actor.customerId === null;
  const fieldErrors = validateCheckoutInput(raw, { guest });
  if (fieldErrors) return failFields(400, fieldErrors);
  const fulfillment = raw.fulfillment as "delivery" | "pickup";
  const paymentMethod = resolveOrderPaymentMethod(
    fulfillment,
    raw.paymentMethod,
  );
  if (!paymentMethod) {
    return failFields(400, {
      paymentMethod: "Phương thức thanh toán không hợp lệ.",
    });
  }

  const cartRows = await listCartRows(actor.cartId);
  if (cartRows.length === 0) {
    return fail(400, "Giỏ hàng đang trống. Hãy chọn sản phẩm trước.");
  }

  const reserved = await reserveOrderLines(
    cartRows.map((row) => ({
      partId: row.part_id,
      partName: row.part_name ?? undefined,
      quantity: row.qty ?? 0,
    })),
  );
  if (!reserved.ok) return reserved;

  const { lines, subtotal } = reserved.data;
  const shippingFee = orderShippingFee(fulfillment, subtotal);
  const now = new Date();
  const orderId = randomUUID();
  const customerEmail = guest
    ? normalizeEmail(raw.email ?? "")
    : actor.accountEmail || null;

  await insertOrder({
    orderId,
    customerId: actor.customerId,
    customerName: raw.recipientName.trim().replace(/\s+/g, " "),
    customerPhone: normalizePhone(raw.phone),
    customerEmail,
    address:
      fulfillment === "delivery"
        ? {
            province: raw.province.trim(),
            district: raw.district.trim(),
            ward: raw.ward.trim(),
            street: raw.street.trim(),
            fullText: raw.address.trim(),
            lat: raw.addressLat,
            lng: raw.addressLng,
          }
        : null,
    status: "pending",
    paymentStatus: "unpaid",
    paidAt: null,
    paymentMethod,
    fulfillmentType: fulfillment,
    historyNote: guest ? "Đặt hàng (khách vãng lai)" : "Đặt hàng",
    createdBy: actor.customerId,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    note: (raw.note ?? "").trim(),
    monthBucket: monthKey(now, MECHANIC_TIME_ZONE),
    lines,
    paymentId: randomUUID(),
    now,
  });
  await clearCartRows(actor.cartId);

  const row = await findOrderRowById(orderId);
  if (!row) return fail(500, "Không tạo được đơn hàng. Vui lòng thử lại.");
  const [items, history] = await Promise.all([
    listOrderItemRows(orderId),
    listOrderHistoryRows(orderId),
  ]);
  return { ok: true, data: toOrderDetail(row, items, history) };
}

// Signed-in customer checkout: the cart partition and the order both
// carry the account id so the purchase lands in their history.
export async function checkoutCart(
  customerId: string,
  raw: CheckoutInput,
  accountEmail?: string | null,
): Promise<OrdersResult<OrderDetail>> {
  return runCheckout(
    { cartId: customerId, customerId, accountEmail: accountEmail ?? null },
    raw,
  );
}

// Guest checkout: same cart-driven flow against the fw_gid partition,
// but the order keeps customer_id null and stores the contact email the
// guest typed. Guest carts self-expire via their row TTL.
export async function checkoutGuestCart(
  guestId: string,
  raw: CheckoutInput,
): Promise<OrdersResult<OrderDetail>> {
  return runCheckout(
    { cartId: guestId, customerId: null, accountEmail: null },
    raw,
  );
}
