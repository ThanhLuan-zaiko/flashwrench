import type { BookingTravelPoint } from "@/lib/booking/workspace.types";
import type { TrackPoint } from "./TrackingMap";

export type HistoryMapModel = {
  customer: TrackPoint | null;
  mechanic: TrackPoint | null;
  route: TrackPoint[] | undefined;
  hasMap: boolean;
};

export function historyMapModel(
  customer: TrackPoint | null,
  liveMechanic: TrackPoint | null,
  points: BookingTravelPoint[],
): HistoryMapModel {
  const latest = points[points.length - 1];
  const mechanic = liveMechanic ?? (latest ? { lat: latest.lat, lng: latest.lng } : null);
  const route =
    points.length > 1
      ? points.map(({ lat, lng }) => ({ lat, lng }))
      : undefined;
  return {
    customer,
    mechanic,
    route,
    hasMap: customer !== null || mechanic !== null,
  };
}
