// Shared repository stubs for the public rescue suites. Tests mutate
// `rescueStubs` and assert on `mock.calls`. Nothing touches a real
// database. Extend these handles instead of inventing file-local mocks.
import { mock } from "bun:test";
import type { InsertRescueParams } from "@/lib/rescue/rescue.repository";
import type {
  RescueHistoryRow,
  RescueRow,
  RescueStatusRef,
  RescueTransitionWrite,
} from "@/lib/rescue/rescue-workflow.repository";

export const rescueStubs = {
  inserts: [] as InsertRescueParams[],
  rowById: null as RescueRow | null,
  rowReadQueue: [] as (RescueRow | null)[],
  historyRows: [] as RescueHistoryRow[],
  transitionClaimed: true,
  paymentClaimed: true,
  transitions: [] as RescueTransitionWrite[],
};

export function makeRescueRow(overrides?: Partial<RescueRow>): RescueRow {
  return {
    request_id: "11111111-1111-1111-1111-111111111111",
    customer_id: null,
    customer_name: "Nguyen Van An",
    customer_phone: "0912345678",
    customer_email: "an@example.com",
    zone_id: null,
    vehicle_plate: "51F-12345",
    address_lat: 10.7769,
    address_lng: 106.7009,
    address_text: "123 Nguyen Trai, Quan 3",
    status: "open",
    assigned_mechanic_id: null,
    assigned_mechanic_name: null,
    priority: "normal",
    issue_type: "flat_tire",
    eta_min: null,
    price_estimate: 350000,
    final_price: null,
    payment_status: "unpaid",
    payment_confirm_code: null,
    updated_at: new Date(),
    created_at: new Date(),
    ...overrides,
  };
}

export const rescueRepoMocks = {
  insertRescueRequest: mock(
    async (params: InsertRescueParams): Promise<void> => {
      rescueStubs.inserts.push(params);
    },
  ),
};

export const rescueWorkflowRepoMocks = {
  findRescueRowById: mock(
    async (_requestId: string): Promise<RescueRow | null> => {
      if (rescueStubs.rowReadQueue.length > 0) {
        return rescueStubs.rowReadQueue.shift() ?? null;
      }
      return rescueStubs.rowById;
    },
  ),
  claimRescueTransition: mock(
    async (write: RescueTransitionWrite): Promise<boolean> => {
      rescueStubs.transitions.push(write);
      return rescueStubs.transitionClaimed;
    },
  ),
  projectRescueTransition: mock(
    async (_write: RescueTransitionWrite): Promise<void> => undefined,
  ),
  listRescueHistoryRows: mock(
    async (_requestId: string, _limit: number): Promise<RescueHistoryRow[]> =>
      rescueStubs.historyRows,
  ),
  listRescueRefsByStatus: mock(
    async (
      _status: string,
      _limit: number,
      _pageState: string | null,
    ): Promise<{ rows: RescueStatusRef[]; pageState: string | null }> => ({
      rows: [],
      pageState: null,
    }),
  ),
  listRescueRefsByMechanic: mock(
    async (_mechanicId: string): Promise<RescueStatusRef[]> => [],
  ),
  listRescueRefsByCustomer: mock(
    async (_customerId: string): Promise<RescueStatusRef[]> => [],
  ),
};

// rescue-payment.repository (split from the workflow repository): CAS on
// payment_status plus the rotating customer confirmation code.
export const rescuePaymentRepoMocks = {
  claimRescuePaymentStatus: mock(
    async (
      _requestId: string,
      _finalPrice: number,
      _expectedPaymentStatus: string,
      _updatedAt: Date,
    ): Promise<boolean> => rescueStubs.paymentClaimed,
  ),
  setRescuePaymentCode: mock(
    async (
      _requestId: string,
      _code: string | null,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
};

export const rescueDispatchStubs = {
  autoDispatch: null as {
    mechanicId: string;
    mechanicName: string;
    offerExpiresAt: string;
  } | null,
};

export const zoneStubs = {
  zoneId: null as string | null,
};

export const zoneServiceMocks = {
  resolveZoneForPoint: mock(
    async (_point: { lat: number; lng: number }): Promise<string | null> =>
      zoneStubs.zoneId,
  ),
};

export const rescueConfigStubs = {
  values: {
    offerTimeoutMs: 30_000,
    maxReoffers: 10,
    candidateLimit: 50,
    isDefault: true,
    updatedAt: null as string | null,
  },
};

export const rescueConfigMocks = {
  getDispatchConfig: mock(
    async (): Promise<typeof rescueConfigStubs.values> =>
      rescueConfigStubs.values,
  ),
};

export const rescueDispatchMocks = {
  autoDispatchRescue: mock(
    async (
      _requestId: string,
    ): Promise<{
      mechanicId: string;
      mechanicName: string;
      offerExpiresAt: string;
    } | null> => rescueDispatchStubs.autoDispatch,
  ),
  redispatchAfterDecline: mock(
    async (_requestId: string, _declinedBy: string): Promise<void> => undefined,
  ),
  expireRescueOffer: mock(
    async (_requestId: string): Promise<{ expired: boolean }> => ({
      expired: false,
    }),
  ),
};

export function resetRescueMocks(): void {
  rescueStubs.inserts = [];
  rescueStubs.rowById = null;
  rescueStubs.rowReadQueue = [];
  rescueStubs.historyRows = [];
  rescueStubs.transitionClaimed = true;
  rescueStubs.paymentClaimed = true;
  rescueStubs.transitions = [];
  rescueDispatchStubs.autoDispatch = null;
  zoneStubs.zoneId = null;
  rescueConfigStubs.values = {
    offerTimeoutMs: 30_000,
    maxReoffers: 10,
    candidateLimit: 50,
    isDefault: true,
    updatedAt: null,
  };
  for (const fn of Object.values(rescueRepoMocks)) fn.mockClear();
  for (const fn of Object.values(rescueWorkflowRepoMocks)) fn.mockClear();
  for (const fn of Object.values(rescuePaymentRepoMocks)) fn.mockClear();
  for (const fn of Object.values(rescueDispatchMocks)) fn.mockClear();
  for (const fn of Object.values(zoneServiceMocks)) fn.mockClear();
  for (const fn of Object.values(rescueConfigMocks)) fn.mockClear();
}
