import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Slide list for the booking gallery: the cover shot leads, gallery
// shots follow, blanks dropped and duplicates removed so a repeated
// cover never renders twice.
export function serviceImages(service: ServiceItem | null): string[] {
  if (!service) return [];
  const seen = new Set<string>();
  for (const src of [service.imageUrl, ...service.images]) {
    const trimmed = src.trim();
    if (trimmed.length > 0) seen.add(trimmed);
  }
  return [...seen];
}
