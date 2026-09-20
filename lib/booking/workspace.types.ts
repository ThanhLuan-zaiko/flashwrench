import type {
  MechanicBookingItem,
  MechanicBookingSummary,
  MechanicBookingTimelineEntry,
} from "@/lib/mechanic/mechanic.types";

export type WorkspaceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: Record<string, string> };

export type CursorPage<T> = { items: T[]; nextCursor: string | null };

export type BookingSummary = MechanicBookingSummary & {
  customerId: string;
  mechanicId: string | null;
  mechanicName: string;
  vehicleId: string | null;
};

export type BookingReview = {
  id: string;
  bookingId: string;
  mechanicId: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type BookingDetail = BookingSummary & {
  items: MechanicBookingItem[];
  timeline: MechanicBookingTimelineEntry[];
  cancelReason: string;
  review: BookingReview | null;
  location: { lat: number; lng: number; updatedAt: string } | null;
};
