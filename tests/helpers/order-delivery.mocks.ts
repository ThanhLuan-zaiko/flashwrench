// Courier/payment/GPS side of the order model (orders-delivery.repository).
// Split from parts.mocks.ts to keep that file under the line limit; the
// names are re-exported there so existing imports keep working.
import { mock } from "bun:test";
import type { OrderTravelPointRow } from "@/lib/orders/orders.types";

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
  paymentCodeSets: [] as { orderId: string; code: string | null }[],
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
      providerRef?: string | null;
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
  setOrderPaymentCode: mock(
    async (
      orderId: string,
      code: string | null,
      _updatedAt: Date,
    ): Promise<void> => {
      orderDeliveryStubs.paymentCodeSets.push({ orderId, code });
    },
  ),
};
