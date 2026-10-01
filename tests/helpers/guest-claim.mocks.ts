// Shared stubs for the guest-record claim suites: lookup rows in, claim
// writes + ref deletes + payment attaches out. Nothing touches a real
// database. Extend these handles instead of inventing file-local mocks
// for the same modules.
import { mock } from "bun:test";
import type { PublicUser } from "@/lib/auth/user.types";
import type {
  ClaimGuestBookingWrite,
  GuestBookingRefRow,
} from "@/lib/booking/guest-claim.repository";
import type {
  ClaimGuestOrderWrite,
  GuestOrderRefRow,
} from "@/lib/orders/guest-claim.repository";
import type { ClaimPaymentWrite } from "@/lib/payments/payment-claim.repository";

export const guestClaimStubs = {
  bookingRefs: [] as GuestBookingRefRow[],
  orderRefs: [] as GuestOrderRefRow[],
  bookingClaims: [] as ClaimGuestBookingWrite[],
  orderClaims: [] as ClaimGuestOrderWrite[],
  paymentAttaches: [] as ClaimPaymentWrite[],
  deletedBookingRefs: [] as { phone: string; bookingId: string }[],
  deletedOrderRefs: [] as { phone: string; orderId: string }[],
  // Booking ids in this set make claimGuestBooking throw — proves one bad
  // row never stops the remaining claims.
  failingBookingClaims: new Set<string>(),
};

export const guestBookingClaimRepoMocks = {
  listGuestBookingRefsByPhone: mock(
    async (_phone: string): Promise<GuestBookingRefRow[]> =>
      guestClaimStubs.bookingRefs,
  ),
  claimGuestBooking: mock(
    async (write: ClaimGuestBookingWrite): Promise<void> => {
      if (guestClaimStubs.failingBookingClaims.has(write.bookingId)) {
        throw new Error("claim write failed");
      }
      guestClaimStubs.bookingClaims.push(write);
    },
  ),
  deleteGuestBookingRef: mock(
    async (phone: string, bookingId: string): Promise<void> => {
      guestClaimStubs.deletedBookingRefs.push({ phone, bookingId });
    },
  ),
};

export const guestOrderClaimRepoMocks = {
  listGuestOrderRefsByPhone: mock(
    async (_phone: string): Promise<GuestOrderRefRow[]> =>
      guestClaimStubs.orderRefs,
  ),
  claimGuestOrder: mock(async (write: ClaimGuestOrderWrite): Promise<void> => {
    guestClaimStubs.orderClaims.push(write);
  }),
  deleteGuestOrderRef: mock(
    async (phone: string, orderId: string): Promise<void> => {
      guestClaimStubs.deletedOrderRefs.push({ phone, orderId });
    },
  ),
};

export const paymentClaimRepoMocks = {
  attachPaymentToCustomer: mock(
    async (write: ClaimPaymentWrite): Promise<void> => {
      guestClaimStubs.paymentAttaches.push(write);
    },
  ),
};

// Service-level handle for auth suites that mock the whole orchestrator.
export const guestClaimServiceMocks = {
  claimGuestRecords: mock(
    async (_user: PublicUser): Promise<void> => undefined,
  ),
};

export function resetGuestClaimMocks(): void {
  guestClaimStubs.bookingRefs = [];
  guestClaimStubs.orderRefs = [];
  guestClaimStubs.bookingClaims = [];
  guestClaimStubs.orderClaims = [];
  guestClaimStubs.paymentAttaches = [];
  guestClaimStubs.deletedBookingRefs = [];
  guestClaimStubs.deletedOrderRefs = [];
  guestClaimStubs.failingBookingClaims.clear();
  for (const fn of Object.values(guestBookingClaimRepoMocks)) fn.mockClear();
  for (const fn of Object.values(guestOrderClaimRepoMocks)) fn.mockClear();
  for (const fn of Object.values(paymentClaimRepoMocks)) fn.mockClear();
  guestClaimServiceMocks.claimGuestRecords.mockClear();
}
