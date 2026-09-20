// Shared row/response shapes for the cart + parts order domain.

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "refunded";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packing",
  "shipping",
  "delivered",
  "cancelled",
  "refunded",
];

// Allowed forward/backward transitions for staff (dispatcher + admin).
// Cancel restocks items; refund is admin-only and does not restock
// automatically (goods may not come back).
export const STAFF_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packing", "cancelled"],
  packing: ["shipping", "cancelled"],
  shipping: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

// Transitions that put purchased items back into stock.
export const RESTOCK_TRANSITIONS: OrderStatus[] = ["cancelled"];

// delivered -> refunded is restricted to admins.
export const ADMIN_ONLY_TRANSITIONS: OrderStatus[] = ["refunded"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" && (ORDER_STATUSES as string[]).includes(value)
  );
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STAFF_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiresAdminTransition(to: OrderStatus): boolean {
  return ADMIN_ONLY_TRANSITIONS.includes(to);
}

export type AddressSnapshot = {
  province: string;
  district: string;
  ward: string;
  street: string;
  fullText: string;
  lat: number | null;
  lng: number | null;
};

export type CartRow = {
  customer_id: string;
  part_id: string;
  qty: number | null;
  unit_price: number | null;
  part_name: string | null;
  part_image: string | null;
  added_at: Date | null;
};

export type CartItem = {
  partId: string;
  qty: number;
  unitPrice: number;
  partName: string;
  partSlug: string;
  partImage: string;
  stockQty: number;
  available: boolean;
  lineTotal: number;
};

export type CartView = {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
};

export type OrderRow = {
  order_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: AddressSnapshot | null;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  subtotal: number | null;
  shipping_fee: number | null;
  discount: number | null;
  total: number | null;
  coupon_code: string | null;
  note: string | null;
  month_bucket: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type OrderItemRow = {
  order_id: string;
  part_id: string;
  part_name: string | null;
  part_image: string | null;
  sku: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
};

export type OrderHistoryRow = {
  order_id: string;
  changed_at: Date | null;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  note: string | null;
};

export type OrderItem = {
  partId: string;
  partName: string;
  partImage: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  note: string;
  createdAt: string | null;
};

export type OrderDetail = OrderSummary & {
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: AddressSnapshot | null;
  items: OrderItem[];
  history: OrderHistoryEntry[];
};

export type OrderHistoryEntry = {
  changedAt: string | null;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  note: string;
};

export type CheckoutInput = {
  recipientName: string;
  phone: string;
  address: string;
  note?: string;
};

export type OrderFieldErrors = Partial<
  Record<
    | "recipientName"
    | "phone"
    | "address"
    | "note"
    | "qty"
    | "partId"
    | "status"
    | "stockQty"
    | "form",
    string
  >
>;

export type OrdersResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: OrderFieldErrors };

export function orderToIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}
