// Shared repository stubs for the customer booking suites. Same pattern
// as the mechanic stubs: tests mutate `bookingStubs` and assert on
// `mock.calls`. Nothing touches a real database. Extend these handles
// instead of inventing file-local mocks for the same modules.
import { mock } from "bun:test";
import type { InsertCustomerBookingParams } from "@/lib/booking/booking.repository";

export const bookingStubs = {
  inserts: [] as InsertCustomerBookingParams[],
};

export const bookingRepoMocks = {
  insertCustomerBooking: mock(
    async (params: InsertCustomerBookingParams): Promise<void> => {
      bookingStubs.inserts.push(params);
    },
  ),
};

export function resetBookingMocks(): void {
  bookingStubs.inserts = [];
  for (const fn of Object.values(bookingRepoMocks)) fn.mockClear();
}
