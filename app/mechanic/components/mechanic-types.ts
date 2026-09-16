export type { MechanicSection, MechanicSectionId } from "./mechanic-sections";
export { getMechanicSection, MECHANIC_SECTIONS } from "./mechanic-sections";

export type MechanicBookingStatus =
  | "pending"
  | "confirmed"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MechanicBooking = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  serviceName: string;
  serviceId: string;
  address: string;
  latitude: number;
  longitude: number;
  status: MechanicBookingStatus;
  scheduledAt: string;
  price: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type MechanicLocation = {
  latitude: number;
  longitude: number;
  currentBookingId: string | null;
  currentBookingType: "booking" | "emergency" | "none";
  updatedAt: string;
};

export type MechanicStats = {
  totalCompleted: number;
  totalRevenue: number;
  monthlyRevenue: number;
  ratingAverage: number;
  ratingCount: number;
  pendingJobs: number;
  enRouteJobs: number;
  completedThisMonth: number;
  revenueThisMonth: number;
};

export type MechanicIncomeEntry = {
  id: string;
  bookingId: string;
  customerName: string;
  vehiclePlate: string;
  serviceName: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  createdAt: string;
  paidAt: string | null;
};

export type MechanicMapPin = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: "current-location" | "destination" | "job-site" | "home-base";
  bookingId?: string;
  status?: MechanicBookingStatus;
};
