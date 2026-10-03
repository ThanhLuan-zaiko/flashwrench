// Shared repository stubs for the customer booking suites. Same pattern
// as the mechanic stubs: tests mutate `bookingStubs` and assert on
// `mock.calls`. Nothing touches a real database. Extend these handles
// instead of inventing file-local mocks for the same modules.
import { mock } from "bun:test";
import type { InsertCustomerBookingParams } from "@/lib/booking/booking.repository";
import type { CustomerBookingPage } from "@/lib/booking/customer-bookings.repository";

export const bookingStubs = {
  inserts: [] as InsertCustomerBookingParams[],
  customerRefs: { rows: [], pageState: null } as CustomerBookingPage,
};

export const bookingRepoMocks = {
  insertCustomerBooking: mock(
    async (params: InsertCustomerBookingParams): Promise<void> => {
      bookingStubs.inserts.push(params);
    },
  ),
};

export const customerBookingsRepoMocks = {
  listCustomerBookingRefs: mock(
    async (
      _customerId: string,
      _limit: number,
      _pageState?: string | null,
    ): Promise<CustomerBookingPage> => bookingStubs.customerRefs,
  ),
};

export function resetBookingMocks(): void {
  bookingStubs.inserts = [];
  bookingStubs.customerRefs = { rows: [], pageState: null };
  for (const fn of Object.values(bookingRepoMocks)) fn.mockClear();
  for (const fn of Object.values(customerBookingsRepoMocks)) fn.mockClear();
}
