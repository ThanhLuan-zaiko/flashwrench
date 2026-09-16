// Shared repository stubs for the mechanic suites. Same pattern as the
// catalog stubs: tests mutate `mechanicStubs` and assert on `mock.calls`.
// Nothing touches a real database. Extend these handles instead of
// inventing file-local mocks for the same modules.
import { mock } from "bun:test";
import type {
  MechanicBookingItemRow,
  MechanicBookingRow,
  MechanicLocationRow,
  MechanicPaymentRow,
  MechanicProfileRow,
  MechanicReviewRow,
  MechanicStatusHistoryRow,
  MechanicWorkloadRow,
} from "@/lib/mechanic/mechanic.types";
import type { BookingStatusWrite } from "@/lib/mechanic/mechanic-bookings.repository";
import type {
  AvailableMechanicRow,
  UpsertAvailableMechanicParams,
} from "@/lib/mechanic/mechanic-directory.repository";
import type { MechanicLocationWrite } from "@/lib/mechanic/mechanic-workspace.repository";

export const mechanicStubs = {
  workloadRows: [] as MechanicWorkloadRow[],
  bookingById: null as MechanicBookingRow | null,
  bookingRowsByIds: [] as MechanicBookingRow[],
  itemRows: [] as MechanicBookingItemRow[],
  historyRows: [] as MechanicStatusHistoryRow[],
  profile: null as MechanicProfileRow | null,
  location: null as MechanicLocationRow | null,
  paymentRows: [] as MechanicPaymentRow[],
  reviewRows: [] as MechanicReviewRow[],
};

export const mechanicBookingsRepoMocks = {
  listWorkloadRows: mock(
    async (
      _mechanicId: string,
      _limit: number,
    ): Promise<MechanicWorkloadRow[]> => mechanicStubs.workloadRows,
  ),
  findBookingRowById: mock(
    async (_bookingId: string): Promise<MechanicBookingRow | null> =>
      mechanicStubs.bookingById,
  ),
  listBookingRowsByIds: mock(
    async (_bookingIds: string[]): Promise<MechanicBookingRow[]> =>
      mechanicStubs.bookingRowsByIds,
  ),
  listBookingItemRowsByBookingIds: mock(
    async (_bookingIds: string[]): Promise<MechanicBookingItemRow[]> =>
      mechanicStubs.itemRows,
  ),
  listStatusHistoryRows: mock(
    async (
      _bookingId: string,
      _limit: number,
    ): Promise<MechanicStatusHistoryRow[]> => mechanicStubs.historyRows,
  ),
  writeBookingStatus: mock(
    async (_params: BookingStatusWrite): Promise<void> => undefined,
  ),
};

export const mechanicWorkspaceRepoMocks = {
  findMechanicProfileRow: mock(
    async (_mechanicId: string): Promise<MechanicProfileRow | null> =>
      mechanicStubs.profile,
  ),
  findMechanicLocationRow: mock(
    async (_mechanicId: string): Promise<MechanicLocationRow | null> =>
      mechanicStubs.location,
  ),
  setMechanicAvailability: mock(
    async (
      _mechanicId: string,
      _isAvailable: boolean,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setMechanicCompletedJobs: mock(
    async (
      _mechanicId: string,
      _completedJobs: number,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  upsertMechanicLocation: mock(
    async (_params: MechanicLocationWrite): Promise<void> => undefined,
  ),
  listPaymentRowsByRefIds: mock(
    async (
      _refType: string,
      _refIds: string[],
    ): Promise<MechanicPaymentRow[]> => mechanicStubs.paymentRows,
  ),
  listReviewRowsByTarget: mock(
    async (
      _targetType: string,
      _targetId: string,
      _limit: number,
    ): Promise<MechanicReviewRow[]> => mechanicStubs.reviewRows,
  ),
};

export const mechanicDirectoryStubs = {
  rows: [] as AvailableMechanicRow[],
};

export const mechanicDirectoryRepoMocks = {
  listAvailableMechanicRows: mock(
    async (_limit: number): Promise<AvailableMechanicRow[]> =>
      mechanicDirectoryStubs.rows,
  ),
  upsertAvailableMechanic: mock(
    async (_params: UpsertAvailableMechanicParams): Promise<void> => undefined,
  ),
  deleteAvailableMechanic: mock(
    async (_ratingAvg: number | null, _mechanicId: string): Promise<void> =>
      undefined,
  ),
};

export function resetMechanicMocks(): void {
  mechanicStubs.workloadRows = [];
  mechanicStubs.bookingById = null;
  mechanicStubs.bookingRowsByIds = [];
  mechanicStubs.itemRows = [];
  mechanicStubs.historyRows = [];
  mechanicStubs.profile = null;
  mechanicStubs.location = null;
  mechanicStubs.paymentRows = [];
  mechanicStubs.reviewRows = [];
  mechanicDirectoryStubs.rows = [];
  for (const fn of Object.values(mechanicBookingsRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicWorkspaceRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicDirectoryRepoMocks)) fn.mockClear();
}
