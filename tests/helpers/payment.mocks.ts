// Payment + revenue repository stubs. Split from workspace.mocks.ts so
// both files stay under the line limit — stubs still live on the shared
// `workspaceStubs` object so existing tests keep their handles.
import { mock } from "bun:test";
import type {
  PaymentRow,
  PaymentWrite,
} from "@/lib/payments/booking-payment.repository";
import type { PaymentPromptRow } from "@/lib/payments/payment-prompt.types";
import type {
  AuditEventWrite,
  ReceiptProjectionWrite,
} from "@/lib/revenue/revenue.types";
import { workspaceStubs } from "./workspace.mocks";

// In-memory stand-in for payment_prompts_by_customer: the service layer
// still decides when to upsert/clear; tests assert on the captured rows.
export const paymentPromptStubs = {
  rows: [] as PaymentPromptRow[],
};

export const paymentPromptRepoMocks = {
  putPaymentPrompt: mock(
    async (input: {
      customerId: string;
      refType: string;
      refId: string;
      title: string;
      amountDue: number;
      issuedAt: Date;
    }): Promise<void> => {
      paymentPromptStubs.rows = [
        ...paymentPromptStubs.rows.filter(
          (row) =>
            !(
              row.customer_id === input.customerId &&
              row.ref_type === input.refType &&
              row.ref_id === input.refId
            ),
        ),
        {
          customer_id: input.customerId,
          ref_type: input.refType,
          ref_id: input.refId,
          title: input.title,
          amount_due: input.amountDue,
          issued_at: input.issuedAt,
        },
      ];
    },
  ),
  deletePaymentPrompt: mock(
    async (
      customerId: string,
      refType: string,
      refId: string,
    ): Promise<void> => {
      paymentPromptStubs.rows = paymentPromptStubs.rows.filter(
        (row) =>
          !(
            row.customer_id === customerId &&
            row.ref_type === refType &&
            row.ref_id === refId
          ),
      );
    },
  ),
  listPaymentPromptRows: mock(
    async (customerId: string): Promise<PaymentPromptRow[]> =>
      paymentPromptStubs.rows.filter((row) => row.customer_id === customerId),
  ),
};

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
  paymentPromptStubs.rows = [];
  for (const fn of Object.values(paymentPromptRepoMocks)) fn.mockClear();
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
