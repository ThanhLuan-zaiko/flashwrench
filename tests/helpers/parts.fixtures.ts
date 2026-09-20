import type {
  CartRow,
  CheckoutInput,
  OrderHistoryRow,
  OrderItemRow,
  OrderRow,
} from "@/lib/orders/orders.types";
import type {
  CreatePartInput,
  PartCategoryRow,
  PartRow,
} from "@/lib/parts/parts.types";

// Builders for the parts/orders suites. Each test derives its own rows
// instead of mutating shared objects, mirroring catalog.fixtures.ts.

export function makePartCategoryRow(
  overrides?: Partial<PartCategoryRow>,
): PartCategoryRow {
  return {
    category_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    name: "Dau nhot",
    slug: "dau-nhot",
    icon: "",
    description: "Cac loai dau nhot dong co.",
    sort_order: 1,
    is_active: true,
    is_deleted: false,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  };
}

export function makePartRow(overrides?: Partial<PartRow>): PartRow {
  return {
    part_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    sku: "DN-10W40",
    name: "Dau nhot 10W-40",
    slug: "dau-nhot-10w-40",
    brand: "Shell",
    category_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    category_name: "Dau nhot",
    car_brands: ["Honda"],
    car_models: ["Wave"],
    price: 120000,
    compare_price: null,
    stock_qty: 10,
    sold_count: 3,
    images: ["/api/media/part/2026-09/cover.jpg"],
    specs: null,
    description: "Dau nhot tong hop.",
    rating_avg: 4.5,
    rating_count: 12,
    is_active: true,
    is_deleted: false,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  };
}

export function makePartInput(
  overrides?: Partial<CreatePartInput>,
): CreatePartInput {
  return {
    sku: "BG-NGK-01",
    name: "Bugi NGK",
    slug: "bugi-ngk",
    brand: "NGK",
    categoryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    carBrands: ["Yamaha"],
    carModels: ["Exciter"],
    price: 85000,
    comparePrice: 99000,
    stockQty: 20,
    images: [],
    imageAssetIds: [],
    specs: {},
    description: "Bugi tieu chuan.",
    isActive: true,
    ...overrides,
  };
}

export function makeCartRow(overrides?: Partial<CartRow>): CartRow {
  return {
    customer_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    part_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    qty: 2,
    unit_price: 120000,
    part_name: "Dau nhot 10W-40",
    part_image: "/api/media/part/2026-09/cover.jpg",
    added_at: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeOrderRow(overrides?: Partial<OrderRow>): OrderRow {
  return {
    order_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    customer_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    customer_name: "Nguyen Van A",
    customer_phone: "0901234567",
    shipping_address: {
      province: "",
      district: "",
      ward: "",
      street: "",
      fullText: "123 Duong ABC, Quan 1",
      lat: null,
      lng: null,
    },
    status: "pending",
    payment_status: "unpaid",
    payment_method: "cod",
    subtotal: 240000,
    shipping_fee: 30000,
    discount: 0,
    total: 270000,
    coupon_code: null,
    note: null,
    month_bucket: "2026-01",
    created_at: new Date("2026-01-05T00:00:00.000Z"),
    updated_at: new Date("2026-01-05T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeOrderItemRow(
  overrides?: Partial<OrderItemRow>,
): OrderItemRow {
  return {
    order_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    part_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    part_name: "Dau nhot 10W-40",
    part_image: "/api/media/part/2026-09/cover.jpg",
    sku: "DN-10W40",
    quantity: 2,
    unit_price: 120000,
    line_total: 240000,
    ...overrides,
  };
}

export function makeOrderHistoryRow(
  overrides?: Partial<OrderHistoryRow>,
): OrderHistoryRow {
  return {
    order_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    changed_at: new Date("2026-01-05T00:00:00.000Z"),
    old_status: null,
    new_status: "pending",
    changed_by: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    note: null,
    ...overrides,
  };
}

export function makeCheckoutInput(
  overrides?: Partial<CheckoutInput>,
): CheckoutInput {
  return {
    recipientName: "Nguyen Van A",
    phone: "0901234567",
    address: "123 Duong ABC, Phuong Ben Nghe, Quan 1",
    note: "Giao gio hanh chinh",
    ...overrides,
  };
}
