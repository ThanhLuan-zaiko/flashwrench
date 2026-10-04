import type { BookingServiceSnapshot } from "./booking.types";

export type CustomerBookingAddress = {
  province: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  full_text: string;
  lat: number | null;
  lng: number | null;
};

export type InsertCustomerBookingParams = {
  bookingId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  address: CustomerBookingAddress;
  scheduledAt: Date;
  timezone: string;
  durationMin: number;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  total: number;
  notes: string | null;
  monthBucket: string;
  createdAt: Date;
  updatedAt: Date;
  items: BookingServiceSnapshot[];
  mechanicId: string | null;
  mechanicName: string | null;
  vehicleId: string | null;
};
