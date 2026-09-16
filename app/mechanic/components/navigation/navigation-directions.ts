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
