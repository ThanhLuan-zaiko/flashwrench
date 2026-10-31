// Real catalog data for the landing page: service and product cards render
// from the same public catalogs the /services and /products pages use. Both
// reads race the marketing budget and degrade to [] so a data outage only
// hides its section instead of failing the page.

import { listPublicCatalog } from "@/lib/catalog/public-catalog.service";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type { PartItem } from "@/lib/parts/parts.types";
import { listPublicParts } from "@/lib/parts/public-parts.service";
import { deadlineAfter } from "./budget";
import { SHOWCASE_BUDGET_MS } from "./mechanic-showcase.service";

export const HOME_SERVICE_LIMIT = 4;
export const HOME_PRODUCT_LIMIT = 8;
export const AUTH_SERVICE_LIMIT = 5;

// Services with a photo lead the rail, then alphabetical by name, matching
// the ordering the public catalog already uses.
export function pickHomeServices(
  services: ServiceItem[],
  limit = HOME_SERVICE_LIMIT,
): ServiceItem[] {
  return services
    .filter((service) => service.isActive && !service.isDeleted)
    .sort((a, b) => {
      const imageA = a.imageUrl ? 1 : 0;
      const imageB = b.imageUrl ? 1 : 0;
      if (imageA !== imageB) return imageB - imageA;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, Math.max(0, limit));
}

// Photographed services for the login/register showcase: the newest few, so
// the slideshow stays short however large the catalog grows. A missing
// createdAt sorts last.
export function pickAuthServices(
  services: ServiceItem[],
  limit = AUTH_SERVICE_LIMIT,
): ServiceItem[] {
  return services
    .filter(
      (service) => service.isActive && !service.isDeleted && service.imageUrl,
    )
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, Math.max(0, limit));
}

// In-stock parts only, best sellers first. Photo-less parts rank last so
// the strip never shows an empty tile while a photographed one is hidden.
export function pickHomeProducts(
  parts: PartItem[],
  limit = HOME_PRODUCT_LIMIT,
): PartItem[] {
  return parts
    .filter((part) => part.isActive && !part.isDeleted && part.stockQty > 0)
    .sort((a, b) => {
      const imageA = a.imageUrl ? 1 : 0;
      const imageB = b.imageUrl ? 1 : 0;
      if (imageA !== imageB) return imageB - imageA;
      return b.soldCount - a.soldCount;
    })
    .slice(0, Math.max(0, limit));
}

async function loadHomeServices(limit: number): Promise<ServiceItem[]> {
  const result = await listPublicCatalog();
  return result.ok ? pickHomeServices(result.data.services, limit) : [];
}

async function loadHomeProducts(limit: number): Promise<PartItem[]> {
  const result = await listPublicParts();
  return result.ok ? pickHomeProducts(result.data.parts, limit) : [];
}

export async function listHomeServices(
  limit = HOME_SERVICE_LIMIT,
): Promise<ServiceItem[]> {
  try {
    return await Promise.race([
      loadHomeServices(limit),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Home services"),
    ]);
  } catch {
    return [];
  }
}

export async function listAuthServices(
  limit = AUTH_SERVICE_LIMIT,
): Promise<ServiceItem[]> {
  try {
    const result = await Promise.race([
      listPublicCatalog(),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Auth services"),
    ]);
    return result.ok ? pickAuthServices(result.data.services, limit) : [];
  } catch {
    return [];
  }
}

export async function listHomeProducts(
  limit = HOME_PRODUCT_LIMIT,
): Promise<PartItem[]> {
  try {
    return await Promise.race([
      loadHomeProducts(limit),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Home products"),
    ]);
  } catch {
    return [];
  }
}
