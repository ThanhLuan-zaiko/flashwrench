import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";

export type DispatchAction = "assign" | "confirm" | "cancel";

export type DispatchListParams = {
  status?: string;
  month?: string;
  cursor?: string | null;
  limit?: unknown;
};

export const DISPATCH_DEFAULT_STATUS: MechanicBookingStatus = "pending";
