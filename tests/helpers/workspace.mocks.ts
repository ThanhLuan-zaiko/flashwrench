import { mock } from "bun:test";
import type { CustomerBookingPage } from "@/lib/booking/customer-bookings.repository";
import type {
  BookingReviewRow,
  BookingReviewWrite,
} from "@/lib/booking/review.repository";
import type {
  BookingTravelPointRow,
  BookingTravelPointWrite,
} from "@/lib/booking/booking-travel.repository";
import type { StatusBookingPage } from "@/lib/dispatch/dispatch.repository";
import type {
  MechanicPresenceUpdateParams,
  MechanicProfileInitParams,
} from "@/lib/mechanic/mechanic-profile.repository";
import type {
  PaymentRow,
  PaymentWrite,
} from "@/lib/payments/booking-payment.repository";
import type {
  MaintenanceInsertParams,
  MaintenancePageResult,
  VehicleInsertParams,
  VehiclePageResult,
  VehicleRow,
} from "@/lib/vehicles/vehicle.repository";

export {
  makeMaintenanceRow,
  makePaymentReceiptRow,
  makeReviewBookingRow,
  makeVehicleRow,
  VEHICLE_ID,
} from "./workspace.fixtures";

export const workspaceStubs = {
  vehicleById: null as VehicleRow | null,
  vehicleRowsById: new Map<string, VehicleRow>(),
  vehicleWriteFails: false,
  vehicleIdsByOwner: {
    vehicleIds: [] as string[],
    pageState: null,
  } as VehiclePageResult,
  plateClaimed: true,
  releasedPlates: [] as string[],
  insertedVehicles: [] as VehicleInsertParams[],
  updatedVehicles: [] as unknown[],
  maintenancePage: { rows: [], pageState: null } as MaintenancePageResult,
  maintenanceInserts: [] as MaintenanceInsertParams[],
  reviewByBooking: null as BookingReviewRow | null,
  reviewReadQueue: [] as (BookingReviewRow | null)[],
  reviewClaimed: true,
  reviewWrites: [] as BookingReviewWrite[],
  paymentById: null as PaymentRow | null,
  paymentRefIds: [] as string[],
  paymentClaimed: true,
  paymentStatusClaimed: true,
  paymentWrites: [] as PaymentWrite[],
  paymentStatusClaims: 0,
  customerBookingPage: { rows: [], pageState: null } as CustomerBookingPage,
  customerBookingPages: [] as CustomerBookingPage[],
  bookingTravelPoints: [] as BookingTravelPointRow[],
  insertedTravelPoints: [] as BookingTravelPointWrite[],
  dispatchRefPage: { rows: [], pageState: null } as StatusBookingPage,
  dispatchRefPages: [] as StatusBookingPage[],
  profileInit: [] as MechanicProfileInitParams[],
  presenceUpdates: [] as MechanicPresenceUpdateParams[],
  published: [] as { topic: string; payload: unknown }[],
};

export const vehicleRepoMocks = {
  findVehicleRowById: mock(
    async (vehicleId: string): Promise<VehicleRow | null> =>
      workspaceStubs.vehicleRowsById.get(vehicleId) ??
      workspaceStubs.vehicleById,
  ),
  listVehicleIdsByOwner: mock(
    async (
      _ownerId: string,
      _limit: number,
      _pageState?: string | null,
    ): Promise<VehiclePageResult> => workspaceStubs.vehicleIdsByOwner,
  ),
  claimVehiclePlate: mock(
    async (
      _licensePlate: string,
      _vehicleId: string,
      _ownerId: string,
    ): Promise<boolean> => workspaceStubs.plateClaimed,
  ),
  releaseVehiclePlate: mock(
    async (licensePlate: string, _vehicleId: string): Promise<void> => {
      workspaceStubs.releasedPlates.push(licensePlate);
    },
  ),
  insertVehicle: mock(async (params: VehicleInsertParams): Promise<void> => {
    if (workspaceStubs.vehicleWriteFails) throw new Error("timeout");
    workspaceStubs.insertedVehicles.push(params);
  }),
  updateVehicle: mock(
    async (params: {
      vehicleId: string;
      ownerId: string;
      createdAt: Date;
      brand: string;
      model: string;
      year: number | null;
      vehicleType: string;
      odometerKm: number;
      archived: boolean;
      updatedAt: Date;
    }): Promise<void> => {
      workspaceStubs.updatedVehicles.push(params);
      if (workspaceStubs.vehicleById?.vehicle_id === params.vehicleId) {
        workspaceStubs.vehicleById = {
          ...workspaceStubs.vehicleById,
          brand: params.brand,
          model: params.model,
          year: params.year,
          vehicle_type: params.vehicleType,
          odometer_km: params.odometerKm,
          is_archived: params.archived,
          updated_at: params.updatedAt,
        };
      }
    },
  ),
  listMaintenanceRowsByVehicle: mock(
    async (
      _vehicleId: string,
      _limit: number,
      _pageState?: string | null,
    ): Promise<MaintenancePageResult> => workspaceStubs.maintenancePage,
  ),
  insertMaintenanceRecord: mock(
    async (params: MaintenanceInsertParams): Promise<void> => {
      workspaceStubs.maintenanceInserts.push(params);
    },
  ),
};

export const mechanicProfileRepoMocks = {
  initMechanicProfileRow: mock(
    async (params: MechanicProfileInitParams): Promise<void> => {
      workspaceStubs.profileInit.push(params);
    },
  ),
  updateMechanicPresence: mock(
    async (params: MechanicPresenceUpdateParams): Promise<void> => {
      workspaceStubs.presenceUpdates.push(params);
    },
  ),
};

export const reviewRepoMocks = {
  findReviewRowByBookingId: mock(
    async (_bookingId: string): Promise<BookingReviewRow | null> => {
      if (workspaceStubs.reviewReadQueue.length > 0) {
        return workspaceStubs.reviewReadQueue.shift() ?? null;
      }
      return workspaceStubs.reviewByBooking;
    },
  ),
  claimBookingReview: mock(
    async (_write: BookingReviewWrite): Promise<boolean> =>
      workspaceStubs.reviewClaimed,
  ),
  projectBookingReview: mock(
    async (write: BookingReviewWrite): Promise<void> => {
      workspaceStubs.reviewWrites.push(write);
    },
  ),
};

export const paymentRepoMocks = {
  findPaymentRowById: mock(
    async (_paymentId: string): Promise<PaymentRow | null> =>
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
};

export const customerBookingsRepoMocks = {
  listCustomerBookingRefs: mock(
    async (
      _customerId: string,
      _limit: number,
      _pageState?: string | null,
    ): Promise<CustomerBookingPage> =>
      workspaceStubs.customerBookingPages.shift() ??
      workspaceStubs.customerBookingPage,
  ),
};

export const bookingTravelRepoMocks = {
  insertBookingTravelPoint: mock(
    async (point: BookingTravelPointWrite): Promise<void> => {
      workspaceStubs.insertedTravelPoints.push(point);
    },
  ),
  listBookingTravelPoints: mock(
    async (_bookingId: string): Promise<BookingTravelPointRow[]> =>
      workspaceStubs.bookingTravelPoints,
  ),
};

export const dispatchRepoMocks = {
  listStatusBookingRefs: mock(
    async (
      _status: string,
      _month: string,
      _limit: number,
      _pageState?: string | null,
    ): Promise<StatusBookingPage> =>
      workspaceStubs.dispatchRefPages.shift() ?? workspaceStubs.dispatchRefPage,
  ),
};

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

export function resetWorkspaceMocks(): void {
  workspaceStubs.vehicleById = null;
  workspaceStubs.vehicleRowsById.clear();
  workspaceStubs.vehicleWriteFails = false;
  workspaceStubs.vehicleIdsByOwner = { vehicleIds: [], pageState: null };
  workspaceStubs.plateClaimed = true;
  workspaceStubs.releasedPlates = [];
  workspaceStubs.insertedVehicles = [];
  workspaceStubs.updatedVehicles = [];
  workspaceStubs.maintenancePage = { rows: [], pageState: null };
  workspaceStubs.maintenanceInserts = [];
  workspaceStubs.reviewByBooking = null;
  workspaceStubs.reviewReadQueue = [];
  workspaceStubs.reviewClaimed = true;
  workspaceStubs.reviewWrites = [];
  workspaceStubs.paymentById = null;
  workspaceStubs.paymentRefIds = [];
  workspaceStubs.paymentClaimed = true;
  workspaceStubs.paymentStatusClaimed = true;
  workspaceStubs.paymentWrites = [];
  workspaceStubs.paymentStatusClaims = 0;
  workspaceStubs.customerBookingPage = { rows: [], pageState: null };
  workspaceStubs.customerBookingPages = [];
  workspaceStubs.bookingTravelPoints = [];
  workspaceStubs.insertedTravelPoints = [];
  workspaceStubs.dispatchRefPage = { rows: [], pageState: null };
  workspaceStubs.dispatchRefPages = [];
  workspaceStubs.profileInit = [];
  workspaceStubs.presenceUpdates = [];
  workspaceStubs.published = [];
  for (const fn of Object.values(vehicleRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicProfileRepoMocks)) fn.mockClear();
  for (const fn of Object.values(reviewRepoMocks)) fn.mockClear();
  for (const fn of Object.values(paymentRepoMocks)) fn.mockClear();
  for (const fn of Object.values(customerBookingsRepoMocks)) fn.mockClear();
  for (const fn of Object.values(bookingTravelRepoMocks)) fn.mockClear();
  for (const fn of Object.values(dispatchRepoMocks)) fn.mockClear();
  for (const fn of Object.values(domainPublishMocks)) fn.mockClear();
  for (const fn of Object.values(realtimePublishMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicAccountSyncMocks)) fn.mockClear();
}
