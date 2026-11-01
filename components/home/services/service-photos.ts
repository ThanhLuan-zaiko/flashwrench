import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Photos for a service's open-row carousel: the cover first, then the gallery,
// without empty entries or repeats.
export function servicePhotos(
  service: Pick<ServiceItem, "imageUrl" | "images">,
): string[] {
  const urls = [service.imageUrl, ...service.images].filter(
    (url): url is string => Boolean(url),
  );
  return [...new Set(urls)];
}
