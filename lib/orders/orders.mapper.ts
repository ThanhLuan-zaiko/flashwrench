import {
  isCourierType,
  isFulfillmentType,
  isOrderStatus,
  type OrderDetail,
  type OrderHistoryEntry,
  type OrderHistoryRow,
  type OrderItem,
  type OrderItemRow,
  type OrderRow,
  type OrderSummary,
  orderToIso,
} from "./orders.types";

export function toOrderSummary(row: OrderRow): OrderSummary {
  return {
    id: row.order_id,
    status: isOrderStatus(row.status) ? row.status : "pending",
    paymentStatus: row.payment_status ?? "unpaid",
    paymentMethod: row.payment_method ?? "cod",
    fulfillmentType: isFulfillmentType(row.fulfillment_type)
      ? row.fulfillment_type
      : "delivery",
    courierType: isCourierType(row.courier_type) ? row.courier_type : null,
    courierId: row.courier_id,
    courierName: row.courier_name,
    trackingCode: row.tracking_code,
    subtotal: row.subtotal ?? 0,
    shippingFee: row.shipping_fee ?? 0,
    discount: row.discount ?? 0,
    total: row.total ?? 0,
    note: row.note ?? "",
    createdAt: orderToIso(row.created_at),
  };
}

export function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    partId: row.part_id,
    partName: row.part_name ?? "",
    partImage: row.part_image ?? "",
    sku: row.sku ?? "",
    quantity: row.quantity ?? 0,
    unitPrice: row.unit_price ?? 0,
    lineTotal: row.line_total ?? 0,
  };
}

export function toHistoryEntry(row: OrderHistoryRow): OrderHistoryEntry {
  return {
    changedAt: orderToIso(row.changed_at),
    oldStatus: row.old_status ?? "",
    newStatus: row.new_status ?? "",
    changedBy: row.changed_by ?? "",
    note: row.note ?? "",
  };
}

export function toOrderDetail(
  row: OrderRow,
  items: OrderItemRow[],
  history: OrderHistoryRow[],
): OrderDetail {
  return {
    ...toOrderSummary(row),
    customerId: row.customer_id,
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    address: row.shipping_address,
    items: items.map(toOrderItem),
    history: history.map(toHistoryEntry),
  };
}
