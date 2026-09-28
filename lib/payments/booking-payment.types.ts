export const BOOKING_PAYMENT_METHODS = ["cod", "bank_transfer"] as const;

export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number];

export type BookingPayment = {
  /** Receipt id — the client-supplied idempotency key for this collection. */
  id: string;
  bookingId: string;
  /** Amount collected by this installment (VND). */
  amount: number;
  method: BookingPaymentMethod;
  paidAt: string | null;
  /** Collected so far including this installment (VND). */
  received: number;
  /** Still owed after this installment (VND). */
  outstanding: number;
  /** Booking payment_status after this write. */
  paymentStatus: "partial" | "paid";
};
