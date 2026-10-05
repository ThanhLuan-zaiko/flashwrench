// Pure constants and shared shapes for the booking intake config. No DB
// imports — client components (admin card, booking form) may import this
// module without dragging the Scylla client into the browser bundle.
export const DEFAULT_MIN_LEAD_DAYS = 2;
export const MIN_LEAD_DAYS_MIN = 0;
export const MIN_LEAD_DAYS_MAX = 14;

// 0 means "no upper bound" — preserves the previous any-future-slot rule.
export const DEFAULT_MAX_ADVANCE_DAYS = 0;
export const MAX_ADVANCE_DAYS_MIN = 0;
export const MAX_ADVANCE_DAYS_MAX = 365;

// 0 means customers can cancel any time while the status allows it.
export const DEFAULT_CANCEL_CUTOFF_HOURS = 0;
export const CANCEL_CUTOFF_HOURS_MIN = 0;
export const CANCEL_CUTOFF_HOURS_MAX = 168;

// Guest intake stays on by default; admins flip it off to force sign-in.
export const DEFAULT_GUEST_BOOKING_ENABLED = true;

export type BookingConfig = {
  minLeadDays: number;
  maxAdvanceDays: number;
  cancelCutoffHours: number;
  guestBookingEnabled: boolean;
  isDefault: boolean;
  updatedAt: string | null;
};

// The intake knobs every path needs; identical to the public endpoint
// shape.
export type BookingPolicy = {
  minLeadDays: number;
  maxAdvanceDays: number;
  cancelCutoffHours: number;
  guestBookingEnabled: boolean;
};

export type BookingConfigErrors = Partial<
  Record<
    | "minLeadDays"
    | "maxAdvanceDays"
    | "cancelCutoffHours"
    | "guestBookingEnabled"
    | "form",
    string
  >
>;

export type BookingConfigResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: BookingConfigErrors };
