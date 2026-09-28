// Payment + revenue repository stubs. Split from workspace.mocks.ts so
// both files stay under the line limit — stubs still live on the shared
// `workspaceStubs` object so existing tests keep their handles.
import { mock } from "bun:test";
import type {
  PaymentRow,
  PaymentWrite,
} from "@/lib/payments/booking-payment.repository";
import type {
  AuditEventWrite,
  ReceiptProjectionWrite,
} from "@/lib/revenue/revenue.types";
import { workspaceStubs } from "./workspace.mocks";

export const paymentRepoMocks = {
  findPaymentRowById: mock(
    async (paymentId: string): Promise<PaymentRow | null> =>
      workspaceStubs.paymentRowsById.get(paymentId) ??
      workspaceStubs.paymentById,
  ),
  listPaymentRefPaymentIds: mock(
    async (_refType: string, _refId: string): Promise<string[]> =>
      workspaceStubs.paymentRefIds,
  ),
  claimBookingPayment: mock(
    async (_write: PaymentWrite): Promise<boolean> =>
      workspaceStubs.paymentClaimed,
  ),
  projectBookingPayment: mock(async (write: PaymentWrite): Promise<void> => {
    workspaceStubs.paymentWrites.push(write);
  }),
  claimBookingPaymentStatus: mock(
    async (
      _bookingId: string,
      _next: string,
      _expectedStatus: string,
      _expectedPaymentStatus: string,
      _updatedAt: Date,
    ): Promise<boolean> => {
      workspaceStubs.paymentStatusClaims += 1;
      return workspaceStubs.paymentStatusClaimed;
    },
  ),
  setBookingPaymentCode: mock(
    async (
      bookingId: string,
      code: string | null,
      _updatedAt: Date,
    ): Promise<void> => {
      workspaceStubs.paymentCodeSets.push({ bookingId, code });
    },
  ),
};

export const revenueServiceMocks = {
  projectReceipt: mock(async (write: ReceiptProjectionWrite): Promise<void> => {
    workspaceStubs.receiptProjections.push(write);
  }),
  recordAuditEvent: mock(async (write: AuditEventWrite): Promise<void> => {
    workspaceStubs.auditEvents.push(write);
  }),
  markReceiptRefunded: mock(
    async (_paymentId: string, _actorId: string | null): Promise<void> =>
      undefined,
  ),
};

// rescue-payment.repository was split out of rescue-workflow.repository;
// its stubs live beside the shared payment handles.
export const rescuePaymentRepoMocks = {
  claimRescuePaymentStatus: mock(
    async (
      _requestId: string,
      _finalPrice: number,
      _expectedPaymentStatus: string,
      _updatedAt: Date,
    ): Promise<boolean> => workspaceStubs.rescuePaymentClaimed,
  ),
  setRescuePaymentCode: mock(
    async (
      requestId: string,
      code: string | null,
      _updatedAt: Date,
    ): Promise<void> => {
      workspaceStubs.rescuePaymentCodeSets.push({ requestId, code });
    },
  ),
};

export function resetPaymentMocks(): void {
  workspaceStubs.paymentById = null;
  workspaceStubs.paymentRowsById.clear();
  workspaceStubs.paymentRefIds = [];
  workspaceStubs.paymentClaimed = true;
  workspaceStubs.paymentStatusClaimed = true;
  workspaceStubs.paymentWrites = [];
  workspaceStubs.paymentStatusClaims = 0;
  workspaceStubs.paymentCodeSets = [];
  workspaceStubs.receiptProjections = [];
  workspaceStubs.auditEvents = [];
  workspaceStubs.rescuePaymentClaimed = true;
  workspaceStubs.rescuePaymentCodeSets = [];
  for (const fn of Object.values(paymentRepoMocks)) fn.mockClear();
  for (const fn of Object.values(revenueServiceMocks)) fn.mockClear();
  for (const fn of Object.values(rescuePaymentRepoMocks)) fn.mockClear();
}
