import type { ServiceItem } from "./service-catalog.types";

// Live service count per category, taken from the public service list so a
// category never claims services that are hidden or deleted. Pure helper,
// safe for both server reads and client components.
export function countServicesByCategory(
  services: Pick<ServiceItem, "categoryId">[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const service of services) {
    counts.set(service.categoryId, (counts.get(service.categoryId) ?? 0) + 1);
  }
  return counts;
}
