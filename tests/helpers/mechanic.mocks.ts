// Shared repository stubs for the mechanic suites. Same pattern as the
// catalog stubs: tests mutate `mechanicStubs` and assert on `mock.calls`.
// Nothing touches a real database. Extend these handles instead of
// inventing file-local mocks for the same modules.
import { mock } from "bun:test";
import type { BookingWorkflowWrite } from "@/lib/booking/booking-workflow.types";
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
import type {
  AvailableMechanicRow,
  UpsertAvailableMechanicParams,
} from "@/lib/mechanic/mechanic-directory.repository";
import type { MechanicLocationWrite } from "@/lib/mechanic/mechanic-workspace.repository";

export const mechanicStubs = {
  workloadRows: [] as MechanicWorkloadRow[],
  workloadRowsInRange: [] as MechanicWorkloadRow[],
  workloadPageRows: [] as MechanicWorkloadRow[],
  workloadPageState: null as string | null,
  bookingById: null as MechanicBookingRow | null,
  bookingReadQueue: [] as (MechanicBookingRow | null)[],
  bookingRowsByIds: [] as MechanicBookingRow[],
  bookingRowsByIdsQueue: [] as MechanicBookingRow[][],
  itemRows: [] as MechanicBookingItemRow[],
  historyRows: [] as MechanicStatusHistoryRow[],
  profile: null as MechanicProfileRow | null,
  profilesById: new Map<string, MechanicProfileRow>(),
  profileReadQueue: [] as (MechanicProfileRow | null)[],
  location: null as MechanicLocationRow | null,
  paymentRows: [] as MechanicPaymentRow[],
  reviewRows: [] as MechanicReviewRow[],
  activeJob: null as string | null,
  activeJobClaimed: true,
  activeJobReleased: [] as string[],
  transitionClaimed: true,
  transitionProjected: [] as unknown[],
};

export const mechanicBookingsRepoMocks = {
  listWorkloadRows: mock(
    async (
      _mechanicId: string,
      _limit: number,
    ): Promise<MechanicWorkloadRow[]> => mechanicStubs.workloadRows,
  ),
  findBookingRowById: mock(
    async (_bookingId: string): Promise<MechanicBookingRow | null> => {
      if (mechanicStubs.bookingReadQueue.length > 0) {
        return mechanicStubs.bookingReadQueue.shift() ?? null;
      }
      return mechanicStubs.bookingById;
    },
  ),
  listBookingRowsByIds: mock(
    async (_bookingIds: string[]): Promise<MechanicBookingRow[]> =>
      mechanicStubs.bookingRowsByIdsQueue.shift() ??
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
  listWorkloadRowsInRange: mock(
    async (
      _mechanicId: string,
      _start: Date,
      _end: Date,
      _limit: number,
    ): Promise<MechanicWorkloadRow[]> => mechanicStubs.workloadRowsInRange,
  ),
  listWorkloadPage: mock(
    async (
      _mechanicId: string,
      _pageState?: string | null,
    ): Promise<{ rows: MechanicWorkloadRow[]; pageState: string | null }> => ({
      rows: mechanicStubs.workloadPageRows,
      pageState: mechanicStubs.workloadPageState,
    }),
  ),
  findMechanicActiveJob: mock(
    async (_mechanicId: string): Promise<string | null> =>
      mechanicStubs.activeJob,
  ),
  insertMechanicActiveJob: mock(
    async (_mechanicId: string, _bookingId: string): Promise<boolean> =>
      mechanicStubs.activeJobClaimed,
  ),
  deleteMechanicActiveJob: mock(
    async (_mechanicId: string, _bookingId: string): Promise<void> => {
      mechanicStubs.activeJobReleased.push(_bookingId);
    },
  ),
};

export const bookingWorkflowRepoMocks = {
  claimBookingTransition: mock(
    async (_write: unknown): Promise<boolean> =>
      mechanicStubs.transitionClaimed,
  ),
  projectBookingTransition: mock(async (_write: unknown): Promise<void> => {
    mechanicStubs.transitionProjected.push(_write);
    // Mirror the real projection: after a successful write, later reads of
    // the same booking row must observe the new status and assignee,
    // otherwise a service re-read returns the pre-transition snapshot.
    const write = _write as BookingWorkflowWrite;
    const next: MechanicBookingRow = {
      ...write.before,
      status: write.status,
      mechanic_id: write.mechanicId,
      mechanic_name: write.mechanicName,
      cancel_reason:
        write.status === "cancelled" ? write.note : write.before.cancel_reason,
      updated_at: write.at,
      month_bucket: write.monthBucket ?? write.before.month_bucket,
    };
    if (mechanicStubs.bookingById?.booking_id === write.before.booking_id) {
      mechanicStubs.bookingById = next;
    }
    mechanicStubs.bookingRowsByIds = mechanicStubs.bookingRowsByIds.map(
      (row) => (row.booking_id === write.before.booking_id ? next : row),
    );
  }),
};

export const mechanicWorkspaceRepoMocks = {
  findMechanicProfileRow: mock(
    async (mechanicId: string): Promise<MechanicProfileRow | null> => {
      if (mechanicStubs.profileReadQueue.length > 0) {
        return mechanicStubs.profileReadQueue.shift() ?? null;
      }
      return (
        mechanicStubs.profilesById.get(mechanicId) ?? mechanicStubs.profile
      );
    },
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
  mechanicStubs.workloadRowsInRange = [];
  mechanicStubs.workloadPageRows = [];
  mechanicStubs.workloadPageState = null;
  mechanicStubs.bookingById = null;
  mechanicStubs.bookingReadQueue = [];
  mechanicStubs.bookingRowsByIds = [];
  mechanicStubs.bookingRowsByIdsQueue = [];
  mechanicStubs.itemRows = [];
  mechanicStubs.historyRows = [];
  mechanicStubs.profile = null;
  mechanicStubs.profilesById.clear();
  mechanicStubs.profileReadQueue = [];
  mechanicStubs.location = null;
  mechanicStubs.paymentRows = [];
  mechanicStubs.reviewRows = [];
  mechanicStubs.activeJob = null;
  mechanicStubs.activeJobClaimed = true;
  mechanicStubs.activeJobReleased = [];
  mechanicStubs.transitionClaimed = true;
  mechanicStubs.transitionProjected = [];
  mechanicDirectoryStubs.rows = [];
  for (const fn of Object.values(mechanicBookingsRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicWorkspaceRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicDirectoryRepoMocks)) fn.mockClear();
  for (const fn of Object.values(bookingWorkflowRepoMocks)) fn.mockClear();
}
