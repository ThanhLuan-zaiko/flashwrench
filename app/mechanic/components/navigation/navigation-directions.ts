// Google Maps directions link for one navigation target. Pure helper so
// both the map card and tests share one URL builder.
import type { MechanicNavigationTarget } from "@/services/mechanic.api";

export function googleDirectionsUrl(
  origin: { lat: number; lng: number } | null,
  target: MechanicNavigationTarget,
): string {
  const destination = `${target.lat},${target.lng}`;
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Plain map view centered on a point. Used where an outbound link only
// needs to show the place, not full directions.
export function googleMapViewUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({ api: "1", query: `${lat},${lng}` });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
