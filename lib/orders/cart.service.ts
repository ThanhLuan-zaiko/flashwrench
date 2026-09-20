import { findPartRowById } from "@/lib/parts/parts.repository";
import {
  isActiveFlag,
  isDeletedFlag,
  type PartRow,
} from "@/lib/parts/parts.types";
import { isUuid } from "@/lib/validation";
import {
  clearCartRows,
  deleteCartItem,
  listCartRows,
  upsertCartItem,
} from "./cart.repository";
import type {
  CartItem,
  CartView,
  OrderFieldErrors,
  OrdersResult,
} from "./orders.types";

const MAX_CART_QTY = 99;

function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}

function sellable(row: PartRow | null): row is PartRow {
  return !!row && isActiveFlag(row.is_active) && !isDeletedFlag(row.is_deleted);
}

function toCartItem(row: {
  part_id: string;
  qty: number | null;
  unit_price: number | null;
  part_name: string | null;
  part_image: string | null;
  part: PartRow | null;
}): CartItem {
  const qty = row.qty ?? 0;
  const live = sellable(row.part) ? row.part : null;
  const unitPrice = live?.price ?? row.unit_price ?? 0;
  return {
    partId: row.part_id,
    qty,
    unitPrice,
    partName: live?.name ?? row.part_name ?? "Sản phẩm",
    partSlug: live?.slug ?? "",
    partImage: live?.images?.[0] ?? row.part_image ?? "",
    stockQty: live?.stock_qty ?? 0,
    available: live !== null && (live.stock_qty ?? 0) >= qty && qty > 0,
    lineTotal: unitPrice * qty,
  };
}

// The cart view always re-reads the part rows: price/name/stock are live
// values, not the snapshot stored in the cart row, so customers see the
// truth before checkout.
export async function getCartView(
  customerId: string,
): Promise<OrdersResult<CartView>> {
  const rows = await listCartRows(customerId);
  const items = await Promise.all(
    rows.map(async (row) =>
      toCartItem({ ...row, part: await findPartRowById(row.part_id) }),
    ),
  );
  items.sort((a, b) => a.partName.localeCompare(b.partName, "vi"));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    ok: true,
    data: {
      items,
      subtotal,
      itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    },
  };
}

function checkQty(qty: unknown): number | null {
  if (typeof qty !== "number" || !Number.isInteger(qty)) return null;
  if (qty < 1 || qty > MAX_CART_QTY) return null;
  return qty;
}

export async function addToCart(
  customerId: string,
  partId: string,
  qty: unknown,
): Promise<OrdersResult<CartView>> {
  if (!isUuid(partId)) {
    return failFields(400, { partId: "Sản phẩm không hợp lệ." });
  }
  const amount = checkQty(qty);
  if (amount === null) {
    return failFields(400, {
      qty: `Số lượng phải là số nguyên từ 1 đến ${MAX_CART_QTY}.`,
    });
  }
  const part = await findPartRowById(partId);
  if (!sellable(part)) {
    return failFields(404, { partId: "Sản phẩm không còn bán." });
  }
  const stock = part.stock_qty ?? 0;
  if (stock <= 0) {
    return failFields(409, { qty: "Sản phẩm đã hết hàng." });
  }
  const existing = (await listCartRows(customerId)).find(
    (r) => r.part_id === partId,
  );
  const nextQty = Math.min((existing?.qty ?? 0) + amount, stock, MAX_CART_QTY);
  await upsertCartItem({
    customerId,
    partId,
    qty: nextQty,
    unitPrice: part.price ?? 0,
    partName: part.name ?? "",
    partImage: part.images?.[0] ?? "",
    now: new Date(),
  });
  return getCartView(customerId);
}

export async function updateCartItemQty(
  customerId: string,
  partId: string,
  qty: unknown,
): Promise<OrdersResult<CartView>> {
  if (!isUuid(partId)) {
    return failFields(400, { partId: "Sản phẩm không hợp lệ." });
  }
  const amount = checkQty(qty);
  if (amount === null) {
    return failFields(400, {
      qty: `Số lượng phải là số nguyên từ 1 đến ${MAX_CART_QTY}.`,
    });
  }
  const rows = await listCartRows(customerId);
  const existing = rows.find((r) => r.part_id === partId);
  if (!existing) {
    return failFields(404, { partId: "Sản phẩm không có trong giỏ." });
  }
  const part = await findPartRowById(partId);
  const capped = sellable(part)
    ? Math.min(amount, Math.max(part.stock_qty ?? 0, 1))
    : amount;
  await upsertCartItem({
    customerId,
    partId,
    qty: capped,
    unitPrice: part?.price ?? existing.unit_price ?? 0,
    partName: part?.name ?? existing.part_name ?? "",
    partImage: part?.images?.[0] ?? existing.part_image ?? "",
    now: new Date(),
  });
  return getCartView(customerId);
}

export async function removeCartItem(
  customerId: string,
  partId: string,
): Promise<OrdersResult<CartView>> {
  if (!isUuid(partId)) {
    return failFields(400, { partId: "Sản phẩm không hợp lệ." });
  }
  await deleteCartItem(customerId, partId);
  return getCartView(customerId);
}

export async function clearCart(
  customerId: string,
): Promise<OrdersResult<CartView>> {
  await clearCartRows(customerId);
  return { ok: true, data: { items: [], subtotal: 0, itemCount: 0 } };
}
