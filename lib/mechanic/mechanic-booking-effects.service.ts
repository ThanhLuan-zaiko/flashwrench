import {
  findVehicleRowById,
  insertMaintenanceRecord,
} from "@/lib/vehicles/vehicle.repository";
import type { MechanicBookingItem, MechanicBookingRow } from "./mechanic.types";
import { toNumberOr } from "./mechanic.types";
import {
  findMechanicProfileRow,
  setMechanicCompletedJobs,
} from "./mechanic-workspace.repository";

export async function writeBookingCompletionEffects(
  mechanicId: string,
  detail: MechanicBookingRow,
  items: MechanicBookingItem[],
  servicedAt: Date,
  mechanicName: string | null,
): Promise<void> {
  if (detail.vehicle_id) {
    const vehicle = await findVehicleRowById(detail.vehicle_id);
    await insertMaintenanceRecord({
      vehicleId: detail.vehicle_id,
      servicedAt,
      recordId: detail.booking_id,
      sourceType: "booking",
      sourceId: detail.booking_id,
      mechanicName: mechanicName ?? detail.mechanic_name,
      summary: items
        .map((item) => item.serviceName)
        .filter((name) => name.length > 0)
        .join(", "),
      cost: detail.total ?? 0,
      odometerKm: vehicle?.odometer_km ?? null,
    });
  }
  const profile = await findMechanicProfileRow(mechanicId);
  await setMechanicCompletedJobs(
    mechanicId,
    toNumberOr(profile?.completed_jobs) + 1,
    servicedAt,
  );
}
