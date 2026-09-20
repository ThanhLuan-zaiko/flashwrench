import { randomUUID } from "node:crypto";
import { normalizePhone, validatePhone } from "@/lib/auth/validation";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { findPartRowById } from "@/lib/parts/parts.repository";
import { isActiveFlag, isDeletedFlag } from "@/lib/parts/parts.types";
import {
  decrementStockForOrder,
  restockForOrder,
} from "@/lib/parts/parts-lifecycle.service";
import { clearCartRows, listCartRows } from "./cart.repository";
import { toOrderDetail } from "./orders.mapper";
import {
  findOrderRowById,
  listOrderHistoryRows,
  listOrderItemRows,
} from "./orders.repository";
import type {
  CheckoutInput,
  OrderDetail,
  OrderFieldErrors,
  OrdersResult,
} from "./orders.types";
import { insertOrder, type NewOrderLine } from "./orders-write.repository";

export const ORDER_ADDRESS_MIN = 10;
export const ORDER_ADDRESS_MAX = 300;
export const ORDER_NOTE_MAX = 500;
// Flat COD shipping fee; orders at/above the threshold ship free.
export const ORDER_SHIPPING_FEE = 30_000;
export const FREE_SHIPPING_THRESHOLD = 500_000;

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
): OrderFieldErrors | null {
  const errors: OrderFieldErrors = {};
  const name = input.recipientName.trim().replace(/\s+/g, " ");
  if (!name) errors.recipientName = "Vui lòng nhập tên người nhận.";
  else if (name.length < 2 || name.length > 100)
    errors.recipientName = "Tên người nhận phải từ 2 đến 100 ký tự.";
  const phoneError = validatePhone(input.phone);
  if (phoneError) errors.phone = phoneError;
  const address = input.address.trim();
  if (!address) errors.address = "Vui lòng nhập địa chỉ nhận hàng.";
  else if (
    address.length < ORDER_ADDRESS_MIN ||
    address.length > ORDER_ADDRESS_MAX
  )
    errors.address = `Địa chỉ phải từ ${ORDER_ADDRESS_MIN} đến ${ORDER_ADDRESS_MAX} ký tự.`;
  if (input.note !== undefined && input.note.length > ORDER_NOTE_MAX) {
    errors.note = `Ghi chú tối đa ${ORDER_NOTE_MAX} ký tự.`;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

// Checkout turns the cart into an order at live prices: every line is
// re-validated against the part row, stock is decremented with CAS
// retries, and a mid-loop failure restocks what was already taken so a
// rejected checkout never strands inventory.
export async function checkoutCart(
  customerId: string,
  raw: CheckoutInput,
): Promise<OrdersResult<OrderDetail>> {
  const fieldErrors = validateCheckoutInput(raw);
  if (fieldErrors) return failFields(400, fieldErrors);

  const cartRows = await listCartRows(customerId);
  if (cartRows.length === 0) {
    return fail(400, "Giỏ hàng đang trống. Hãy chọn sản phẩm trước.");
  }

  type ResolvedLine = {
    partId: string;
    name: string;
    image: string;
    sku: string;
    qty: number;
    price: number;
  };
  const resolved: ResolvedLine[] = [];
  for (const row of cartRows) {
    const part = await findPartRowById(row.part_id);
    if (
      !part ||
      !isActiveFlag(part.is_active) ||
      isDeletedFlag(part.is_deleted)
    ) {
      return fail(
        409,
        `Sản phẩm "${row.part_name ?? "đã chọn"}" không còn bán. Hãy xóa khỏi giỏ.`,
      );
    }
    resolved.push({
      partId: part.part_id,
      name: part.name ?? "",
      image: part.images?.[0] ?? "",
      sku: part.sku ?? "",
      qty: row.qty ?? 0,
      price: part.price ?? 0,
    });
  }

  const decremented: ResolvedLine[] = [];
  for (const line of resolved) {
    const outcome = await decrementStockForOrder(line.partId, line.qty);
    if (outcome !== "ok") {
      // Roll back earlier decrements before reporting the failure.
      for (const done of decremented) {
        await restockForOrder(done.partId, done.qty).catch(() => undefined);
      }
      return fail(
        409,
        outcome === "missing"
          ? `Sản phẩm "${line.name}" không còn bán.`
          : `Sản phẩm "${line.name}" không đủ số lượng tồn kho.`,
      );
    }
    decremented.push(line);
  }

  const lines: NewOrderLine[] = resolved.map((l) => ({
    partId: l.partId,
    partName: l.name,
    partImage: l.image,
    sku: l.sku,
    quantity: l.qty,
    unitPrice: l.price,
    lineTotal: l.price * l.qty,
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shippingFee =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : ORDER_SHIPPING_FEE;
  const now = new Date();
  const orderId = randomUUID();

  await insertOrder({
    orderId,
    customerId,
    customerName: raw.recipientName.trim().replace(/\s+/g, " "),
    customerPhone: normalizePhone(raw.phone),
    address: {
      province: "",
      district: "",
      ward: "",
      street: "",
      fullText: raw.address.trim(),
      lat: null,
      lng: null,
    },
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    note: (raw.note ?? "").trim(),
    monthBucket: monthKey(now, MECHANIC_TIME_ZONE),
    lines,
    paymentId: randomUUID(),
    now,
  });
  await clearCartRows(customerId);

  const row = await findOrderRowById(orderId);
  if (!row) return fail(500, "Không tạo được đơn hàng. Vui lòng thử lại.");
  const [items, history] = await Promise.all([
    listOrderItemRows(orderId),
    listOrderHistoryRows(orderId),
  ]);
  return { ok: true, data: toOrderDetail(row, items, history) };
}
