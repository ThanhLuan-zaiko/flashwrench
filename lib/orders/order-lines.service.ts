import { findPartRowById } from "@/lib/parts/parts.repository";
import { isActiveFlag, isDeletedFlag } from "@/lib/parts/parts.types";
import {
  decrementStockForOrder,
  restockForOrder,
} from "@/lib/parts/parts-lifecycle.service";
import type { OrderFieldErrors, OrdersResult } from "./orders.types";
import type { NewOrderLine } from "./orders-write.repository";

export type OrderLineRequest = {
  partId: string;
  partName?: string;
  quantity: number;
};

export type ReservedOrderLines = {
  lines: NewOrderLine[];
  subtotal: number;
};

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

// Shared by cart checkout and counter sales: every line re-reads the
// live part row (price/name/stock), stock is decremented with CAS, and
// a mid-loop failure restocks what was already taken so a rejected sale
// never strands inventory.
export async function reserveOrderLines(
  requests: OrderLineRequest[],
): Promise<OrdersResult<ReservedOrderLines>> {
  type ResolvedLine = {
    partId: string;
    name: string;
    image: string;
    sku: string;
    qty: number;
    price: number;
  };
  const resolved: ResolvedLine[] = [];
  for (const request of requests) {
    const part = await findPartRowById(request.partId);
    if (
      !part ||
      !isActiveFlag(part.is_active) ||
      isDeletedFlag(part.is_deleted)
    ) {
      return fail(
        409,
        `Sản phẩm "${request.partName ?? part?.name ?? "đã chọn"}" không còn bán.`,
      );
    }
    resolved.push({
      partId: part.part_id,
      name: part.name ?? "",
      image: part.images?.[0] ?? "",
      sku: part.sku ?? "",
      qty: request.quantity,
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
  return {
    ok: true,
    data: {
      lines,
      subtotal: lines.reduce((sum, l) => sum + l.lineTotal, 0),
    },
  };
}

// Field-level validation for staff-entered line lists (counter sale).
export function validateCounterSaleLines(
  lines: { partId: unknown; quantity: unknown }[] | undefined,
): OrderFieldErrors | null {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { lines: "Vui lòng chọn ít nhất một sản phẩm." };
  }
  if (lines.length > 20) {
    return { lines: "Một lần bán tối đa 20 sản phẩm." };
  }
  for (const line of lines) {
    if (typeof line.partId !== "string" || line.partId.length === 0) {
      return { lines: "Có sản phẩm chưa hợp lệ trong danh sách." };
    }
    const qty = line.quantity;
    if (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > 99) {
      return { lines: "Số lượng mỗi sản phẩm phải từ 1 đến 99." };
    }
  }
  return null;
}
