// Shared repository stubs for the parts/orders suites (catalog CRUD,
// cart, checkout, dispatch order operations). Same pattern as
// catalog.mocks.ts: tests mutate the stub state and assert on
// `mock.calls`. Nothing touches a real database. Extend these handles
// instead of inventing file-local mocks for the same modules.
import { mock } from "bun:test";
import type {
  CartRow,
  OrderHistoryRow,
  OrderItemRow,
  OrderRow,
  OrderTravelPointRow,
} from "@/lib/orders/orders.types";
import type { PartCategoryRow, PartRow } from "@/lib/parts/parts.types";

export const partStubs = {
  partRows: [] as PartRow[],
  partById: null as PartRow | null,
  // Per-id rows for multi-part flows (checkout resolves each cart line).
  partsById: {} as Record<string, PartRow>,
  partSlugOwner: null as string | null,
  partSlugClaimed: true,
  partSkuOwner: null as string | null,
  partSkuClaimed: true,
  decrementApplied: true,
  categoryRows: [] as PartCategoryRow[],
  categoryById: null as PartCategoryRow | null,
  categorySlugOwner: null as string | null,
  categorySlugClaimed: true,
};

export const orderStubs = {
  orderById: null as OrderRow | null,
  ordersByCustomer: [] as OrderRow[],
  ordersByCourier: [] as OrderRow[],
  statusPage: { rows: [] as OrderRow[], pageState: null as string | null },
  itemRows: [] as OrderItemRow[],
  historyRows: [] as OrderHistoryRow[],
};

// Courier/payment/GPS side of the order model (orders-delivery.repository).
export const orderDeliveryStubs = {
  paymentRefs: [] as { paymentId: string; createdAt: Date }[],
  travelPointRows: [] as OrderTravelPointRow[],
  insertedTravelPoints: [] as {
    orderId: string;
    courierId: string;
    lat: number;
    lng: number;
    recordedAt: Date;
  }[],
};

export const cartStubs = {
  cartRows: [] as CartRow[],
};

export const partRepoMocks = {
  toPartRow: (row: Record<string, unknown>) => row as unknown as PartRow,
  listPartRows: mock(async (): Promise<PartRow[]> => partStubs.partRows),
  findPartRowById: mock(
    async (partId: string): Promise<PartRow | null> =>
      partStubs.partsById[partId] ?? partStubs.partById,
  ),
  findPartIdBySlug: mock(
    async (_slug: string): Promise<string | null> => partStubs.partSlugOwner,
  ),
  findPartIdBySku: mock(
    async (_sku: string): Promise<string | null> => partStubs.partSkuOwner,
  ),
  claimPartSlug: mock(
    async (_slug: string, _partId: string): Promise<boolean> =>
      partStubs.partSlugClaimed,
  ),
  releasePartSlug: mock(
    async (_slug: string, _partId: string): Promise<boolean> => true,
  ),
  claimPartSku: mock(
    async (_sku: string, _partId: string): Promise<boolean> =>
      partStubs.partSkuClaimed,
  ),
  releasePartSku: mock(
    async (_sku: string, _partId: string): Promise<boolean> => true,
  ),
  insertPart: mock(async (_params: unknown): Promise<void> => undefined),
  updatePartRows: mock(async (_params: unknown): Promise<void> => undefined),
};

export const partInventoryRepoMocks = {
  setPartActive: mock(
    async (
      _partId: string,
      _categoryId: string,
      _createdAt: Date | null,
      _isActive: boolean,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setPartDeleted: mock(
    async (
      _partId: string,
      _categoryId: string,
      _createdAt: Date | null,
      _brand: string,
      _isDeleted: boolean,
      _deletedAt: Date | null,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setPartStock: mock(
    async (
      _partId: string,
      _categoryId: string,
      _createdAt: Date | null,
      _stockQty: number,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  decrementPartStockCas: mock(
    async (
      _partId: string,
      _expectedQty: number,
      _newQty: number,
    ): Promise<boolean> => partStubs.decrementApplied,
  ),
  setPartSoldCount: mock(
    async (_partId: string, _soldCount: number): Promise<void> => undefined,
  ),
  hardDeletePart: mock(async (_params: unknown): Promise<void> => undefined),
};

export const partCategoryRepoMocks = {
  listPartCategoryRows: mock(
    async (): Promise<PartCategoryRow[]> => partStubs.categoryRows,
  ),
  findPartCategoryRowById: mock(
    async (_categoryId: string): Promise<PartCategoryRow | null> =>
      partStubs.categoryById,
  ),
  findPartCategoryIdBySlug: mock(
    async (_slug: string): Promise<string | null> =>
      partStubs.categorySlugOwner,
  ),
  insertPartCategory: mock(
    async (_params: unknown): Promise<void> => undefined,
  ),
  claimPartCategorySlug: mock(
    async (_slug: string, _categoryId: string): Promise<boolean> =>
      partStubs.categorySlugClaimed,
  ),
  releasePartCategorySlug: mock(
    async (_slug: string, _categoryId: string): Promise<boolean> => true,
  ),
  updatePartCategoryRow: mock(
    async (_params: unknown): Promise<void> => undefined,
  ),
  setPartCategoryActive: mock(
    async (
      _categoryId: string,
      _isActive: boolean,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setPartCategoryDeleted: mock(
    async (
      _categoryId: string,
      _isDeleted: boolean,
      _deletedAt: Date | null,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  hardDeletePartCategory: mock(
    async (_categoryId: string, _slug: string): Promise<void> => undefined,
  ),
};

export const cartRepoMocks = {
  listCartRows: mock(
    async (_customerId: string): Promise<CartRow[]> => cartStubs.cartRows,
  ),
  upsertCartItem: mock(async (_params: unknown): Promise<void> => undefined),
  deleteCartItem: mock(
    async (_customerId: string, _partId: string): Promise<void> => undefined,
  ),
  clearCartRows: mock(async (_customerId: string): Promise<void> => undefined),
};

export const orderRepoMocks = {
  toOrderRow: (row: Record<string, unknown>) => row as unknown as OrderRow,
  findOrderRowById: mock(
    async (_orderId: string): Promise<OrderRow | null> => orderStubs.orderById,
  ),
  listOrderRowsByCustomer: mock(
    async (_customerId: string): Promise<OrderRow[]> =>
      orderStubs.ordersByCustomer,
  ),
  listOrderRowsByStatus: mock(
    async (
      _status: string,
      _monthBucket: string,
      _limit: number,
      _pageState: string | null,
    ): Promise<{ rows: OrderRow[]; pageState: string | null }> =>
      orderStubs.statusPage,
  ),
  listOrderItemRows: mock(
    async (_orderId: string): Promise<OrderItemRow[]> => orderStubs.itemRows,
  ),
  listOrderHistoryRows: mock(
    async (_orderId: string): Promise<OrderHistoryRow[]> =>
      orderStubs.historyRows,
  ),
  listOrderRowsByCourier: mock(
    async (_courierId: string): Promise<OrderRow[]> =>
      orderStubs.ordersByCourier,
  ),
};

export const orderDeliveryRepoMocks = {
  assignOrderCourier: mock(
    async (_params: {
      orderId: string;
      courierType: string;
      courierId: string | null;
      courierName: string | null;
      trackingCode: string | null;
      orderCreatedAt: Date;
      orderTotal: number;
      customerName: string;
      now: Date;
    }): Promise<void> => undefined,
  ),
  updateOrderCourierStatus: mock(
    async (_params: {
      courierId: string;
      orderCreatedAt: Date;
      orderId: string;
      status: string;
    }): Promise<void> => undefined,
  ),
  markOrderPaymentStatus: mock(
    async (_params: {
      orderId: string;
      customerId: string | null;
      paymentStatus: string;
      paidAt: Date | null;
      now: Date;
      paymentRefs: { paymentId: string; createdAt: Date }[];
    }): Promise<void> => undefined,
  ),
  insertOrderTravelPoint: mock(
    async (params: {
      orderId: string;
      courierId: string;
      lat: number;
      lng: number;
      recordedAt: Date;
    }): Promise<void> => {
      orderDeliveryStubs.insertedTravelPoints.push(params);
    },
  ),
  listOrderTravelPointRows: mock(
    async (_orderId: string): Promise<OrderTravelPointRow[]> =>
      orderDeliveryStubs.travelPointRows,
  ),
  listOrderPaymentRefs: mock(
    async (
      _orderId: string,
    ): Promise<{ paymentId: string; createdAt: Date }[]> =>
      orderDeliveryStubs.paymentRefs,
  ),
};

export const orderWriteRepoMocks = {
  insertOrder: mock(async (_params: unknown): Promise<void> => undefined),
  updateOrderStatusRows: mock(
    async (_params: unknown): Promise<void> => undefined,
  ),
  insertOrderHistory: mock(
    async (_params: unknown): Promise<void> => undefined,
  ),
};

// Media service stand-in for parts.service / parts-lifecycle.service:
// asset claims succeed and pruning is a no-op.
export const partsMediaServiceMocks = {
  claimAssetsForOwner: mock(
    async (
      _assetIds: string[],
      _ownerType: string,
      _ownerId: string,
    ): Promise<{ ok: true; data: { assetIds: string[] } | null }> => ({
      ok: true,
      data: null,
    }),
  ),
  pruneOwnerAssets: mock(
    async (
      _ownerType: string,
      _ownerId: string,
      _keepUrls: string[],
    ): Promise<{ deleted: number }> => ({ deleted: 0 }),
  ),
};

export function resetPartsMocks(): void {
  partStubs.partRows = [];
  partStubs.partById = null;
  partStubs.partsById = {};
  partStubs.partSlugOwner = null;
  partStubs.partSlugClaimed = true;
  partStubs.partSkuOwner = null;
  partStubs.partSkuClaimed = true;
  partStubs.decrementApplied = true;
  partStubs.categoryRows = [];
  partStubs.categoryById = null;
  partStubs.categorySlugOwner = null;
  partStubs.categorySlugClaimed = true;
  orderStubs.orderById = null;
  orderStubs.ordersByCustomer = [];
  orderStubs.ordersByCourier = [];
  orderStubs.statusPage = { rows: [], pageState: null };
  orderStubs.itemRows = [];
  orderStubs.historyRows = [];
  orderDeliveryStubs.paymentRefs = [];
  orderDeliveryStubs.travelPointRows = [];
  orderDeliveryStubs.insertedTravelPoints = [];
  cartStubs.cartRows = [];
  for (const fn of Object.values(partRepoMocks)) {
    if (typeof fn === "function" && "mockClear" in fn) fn.mockClear();
  }
  for (const fn of Object.values(partInventoryRepoMocks)) fn.mockClear();
  for (const fn of Object.values(partCategoryRepoMocks)) fn.mockClear();
  for (const fn of Object.values(cartRepoMocks)) fn.mockClear();
  for (const fn of Object.values(orderRepoMocks)) {
    if (typeof fn === "function" && "mockClear" in fn) fn.mockClear();
  }
  for (const fn of Object.values(orderWriteRepoMocks)) fn.mockClear();
  for (const fn of Object.values(orderDeliveryRepoMocks)) fn.mockClear();
  for (const fn of Object.values(partsMediaServiceMocks)) fn.mockClear();
}
