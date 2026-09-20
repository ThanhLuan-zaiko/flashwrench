export const BOOKING_PAYMENT_METHODS = ["cod", "bank_transfer"] as const;

export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number];

export type BookingPayment = {
  id: string;
  bookingId: string;
  amount: number;
  method: BookingPaymentMethod;
  paidAt: string | null;
};
