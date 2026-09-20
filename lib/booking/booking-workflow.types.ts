import type {
  MechanicBookingRow,
  MechanicBookingStatus,
} from "@/lib/mechanic/mechanic.types";

export type BookingWorkflowWrite = {
  before: MechanicBookingRow;
  status: MechanicBookingStatus;
  mechanicId: string | null;
  mechanicName: string | null;
  actorId: string;
  note: string | null;
  at: Date;
  monthBucket?: string | null;
};
