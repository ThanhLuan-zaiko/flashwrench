import { mock } from "bun:test";
import { workspaceStubs } from "./workspace-stubs";

export const domainPublishMocks = {
  publishBookingChange: mock(
    async (
      _kind: string,
      _bookingId: string,
      _status: string,
      _customerId: string | null,
      _mechanicIds: (string | null)[],
    ): Promise<void> => {
      workspaceStubs.published.push({
        topic: "*",
        payload: { kind: _kind, bookingId: _bookingId },
      });
    },
  ),
  publishRescueChange: mock(
    async (
      _kind: string,
      _requestId: string,
      _status: string,
      _customerId: string | null,
      _mechanicIds: (string | null)[],
      _zoneId: string | null,
    ): Promise<void> => {
      workspaceStubs.published.push({
        topic: "*",
        payload: { kind: _kind, rescueId: _requestId },
      });
    },
  ),
  publishOrderChange: mock(
    async (
      _orderId: string,
      _status: string,
      _customerId: string | null,
    ): Promise<void> => {
      workspaceStubs.published.push({
        topic: "operations",
        payload: { kind: "orders-updated", orderId: _orderId },
      });
      workspaceStubs.published.push({
        topic: `order:${_orderId}`,
        payload: { kind: "order-updated", orderId: _orderId },
      });
      workspaceStubs.published.push(
        _customerId
          ? {
              topic: `user:${_customerId}`,
              payload: { kind: "order-updated", orderId: _orderId },
            }
          : {
              topic: "*",
              payload: { kind: "order-updated", orderId: _orderId },
            },
      );
    },
  ),
};

export const realtimePublishMocks = {
  publishRealtimeEvent: mock(
    async (topic: string, payload: unknown): Promise<void> => {
      workspaceStubs.published.push({ topic, payload });
    },
  ),
};

export const mechanicAccountSyncMocks = {
  syncMechanicAccount: mock(
    async (_mechanicId: string): Promise<void> => undefined,
  ),
};
