import type { BookingConfigRow } from "@/lib/booking/booking-config.repository";
import type {
  BookingTravelPointRow,
  BookingTravelPointWrite,
} from "@/lib/booking/booking-travel.repository";
import type { CustomerBookingPage } from "@/lib/booking/customer-bookings.repository";
import type {
  BookingReviewRow,
  BookingReviewWrite,
} from "@/lib/booking/review.repository";
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
  AuditEventWrite,
  ReceiptProjectionWrite,
} from "@/lib/revenue/revenue.types";
import type {
  MaintenanceInsertParams,
  MaintenancePageResult,
  VehicleInsertParams,
  VehiclePageResult,
  VehicleRow,
} from "@/lib/vehicles/vehicle.repository";

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
  paymentRowsById: new Map<string, PaymentRow>(),
  paymentRefIds: [] as string[],
  paymentClaimed: true,
  paymentStatusClaimed: true,
  paymentWrites: [] as PaymentWrite[],
  paymentStatusClaims: 0,
  paymentCodeSets: [] as { bookingId: string; code: string | null }[],
  rescuePaymentClaimed: true,
  rescuePaymentCodeSets: [] as { requestId: string; code: string | null }[],
  receiptProjections: [] as ReceiptProjectionWrite[],
  auditEvents: [] as AuditEventWrite[],
  customerBookingPage: { rows: [], pageState: null } as CustomerBookingPage,
  customerBookingPages: [] as CustomerBookingPage[],
  bookingTravelPoints: [] as BookingTravelPointRow[],
  insertedTravelPoints: [] as BookingTravelPointWrite[],
  dispatchRefPage: { rows: [], pageState: null } as StatusBookingPage,
  dispatchRefPages: [] as StatusBookingPage[],
  bookingConfigRow: null as BookingConfigRow | null,
  profileInit: [] as MechanicProfileInitParams[],
  presenceUpdates: [] as MechanicPresenceUpdateParams[],
  published: [] as { topic: string; payload: unknown }[],
};
