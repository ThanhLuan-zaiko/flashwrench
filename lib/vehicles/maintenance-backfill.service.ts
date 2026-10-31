// One-off backfill for visits recorded before due dates existed. Only the
// newest booking-sourced visit per vehicle is re-planned, and only when it
// carries no due values yet, so a rerun changes nothing.
import { planVisitDue, syncDueIndex } from "./maintenance-due.service";
import {
  findBookingServiceIds,
  findLatestVisit,
  setVisitNextDue,
} from "./maintenance-reminder.repository";

export type BackfillOutcome = "written" | "skipped";

export async function backfillVehicleDue(vehicle: {
  vehicleId: string;
  ownerId: string | null;
  isArchived: boolean;
}): Promise<BackfillOutcome> {
  if (!vehicle.ownerId || vehicle.isArchived) return "skipped";
  const latest = await findLatestVisit(vehicle.vehicleId);
  if (
    !latest ||
    latest.nextDueAt !== null ||
    latest.nextDueKm !== null ||
    latest.sourceType !== "booking" ||
    !latest.sourceId
  ) {
    return "skipped";
  }
  const serviceIds = await findBookingServiceIds(latest.sourceId);
  const plan = await planVisitDue({
    vehicleId: vehicle.vehicleId,
    servedAt: latest.servedAt,
    odometerKm: latest.odometerKm,
    serviceIds,
  });
  if (plan.next.dueAt === null && plan.next.dueKm === null) return "skipped";
  await setVisitNextDue({
    vehicleId: vehicle.vehicleId,
    servedAt: latest.servedAt,
    recordId: latest.recordId,
    nextDueAt: plan.next.dueAt,
    nextDueKm: plan.next.dueKm,
  });
  await syncDueIndex({
    vehicleId: vehicle.vehicleId,
    ownerId: vehicle.ownerId,
    plan: { previousDueAt: null, next: plan.next },
  });
  return "written";
}
