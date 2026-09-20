import { mock } from "bun:test";
import type {
  BookingDetail,
  BookingSummary,
  CursorPage,
  WorkspaceResult,
} from "@/lib/booking/workspace.types";
import type { MechanicResult } from "@/lib/mechanic/mechanic.types";
import type { MechanicPresence } from "@/lib/mechanic/mechanic-profile.service";
import type { BookingPayment } from "@/lib/payments/booking-payment.types";
import type {
  MaintenanceItem,
  VehicleItem,
} from "@/lib/vehicles/vehicle.types";
import { routeStubs } from "./route-mocks";

export function okVehicleItem(): VehicleItem {
  return {
    id: "dddddddd-2222-4222-8222-dddddddddddd",
    licensePlate: "51A12345",
    brand: "Toyota",
    model: "Vios",
    year: 2019,
    vehicleType: "car",
    odometerKm: 45000,
    archived: false,
    createdAt: "2026-09-10T00:00:00.000Z",
  };
}

function stubbed<T>(fallback: T): T {
  return (routeStubs.workspaceResult as T | null) ?? fallback;
}

export const vehicleServiceMocks = {
  listVehicles: mock(
    async (
      ..._args: unknown[]
    ): Promise<WorkspaceResult<CursorPage<VehicleItem>>> =>
      stubbed({ ok: true, data: { items: [], nextCursor: null } }),
  ),
  getVehicle: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<VehicleItem>> =>
      stubbed({ ok: true, data: okVehicleItem() }),
  ),
  createVehicle: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<VehicleItem>> =>
      stubbed({ ok: true, data: okVehicleItem() }),
  ),
  updateVehicleDetails: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<VehicleItem>> =>
      stubbed({ ok: true, data: okVehicleItem() }),
  ),
  setVehicleArchived: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<VehicleItem>> =>
      stubbed({ ok: true, data: okVehicleItem() }),
  ),
  listVehicleHistory: mock(
    async (
      ..._args: unknown[]
    ): Promise<WorkspaceResult<CursorPage<MaintenanceItem>>> =>
      stubbed({ ok: true, data: { items: [], nextCursor: null } }),
  ),
};

export const dispatchServiceMocks = {
  listDispatchBookings: mock(
    async (
      ..._args: unknown[]
    ): Promise<WorkspaceResult<CursorPage<BookingSummary>>> =>
      stubbed({ ok: true, data: { items: [], nextCursor: null } }),
  ),
  getDispatchBooking: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<BookingDetail>> =>
      stubbed({ ok: true, data: {} as BookingDetail }),
  ),
  applyDispatchAction: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<BookingSummary>> =>
      stubbed({ ok: true, data: {} as BookingSummary }),
  ),
};

export const mechanicProfileRouteMocks = {
  getMechanicPresence: mock(
    async (..._args: unknown[]): Promise<MechanicResult<MechanicPresence>> =>
      stubbed({
        ok: true,
        data: {
          online: false,
          available: true,
          verified: true,
          skills: [],
          baseLat: null,
          baseLng: null,
        },
      }),
  ),
  updateMechanicProfilePresence: mock(
    async (..._args: unknown[]): Promise<MechanicResult<MechanicPresence>> =>
      stubbed({
        ok: true,
        data: {
          online: true,
          available: true,
          verified: true,
          skills: ["engine"],
          baseLat: 10.775,
          baseLng: 106.7,
        },
      }),
  ),
};

export const paymentRouteMocks = {
  recordBookingPayment: mock(
    async (..._args: unknown[]): Promise<WorkspaceResult<BookingPayment>> =>
      stubbed({
        ok: true,
        data: {
          id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
          bookingId: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
          amount: 450000,
          method: "cod",
          paidAt: "2026-09-16T10:00:00.000Z",
        },
      }),
  ),
};

export function resetWorkspaceRouteMocks(): void {
  for (const fn of Object.values(vehicleServiceMocks)) fn.mockClear();
  for (const fn of Object.values(dispatchServiceMocks)) fn.mockClear();
  for (const fn of Object.values(mechanicProfileRouteMocks)) fn.mockClear();
  for (const fn of Object.values(paymentRouteMocks)) fn.mockClear();
}
