// Real catalog data for the landing page: service and product cards render
// from the same public catalogs the /services and /products pages use. Both
// reads race the marketing budget and degrade to [] so a data outage only
// hides its section instead of failing the page.

import { cache } from "react";
import { countServicesByCategory } from "@/lib/catalog/catalog-counts";
import { listPublicCatalog } from "@/lib/catalog/public-catalog.service";
import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import type { PartItem } from "@/lib/parts/parts.types";
import { listPublicParts } from "@/lib/parts/public-parts.service";
import { deadlineAfter } from "./budget";
import { SHOWCASE_BUDGET_MS } from "./mechanic-showcase.service";
import { type PriceRange, priceRangeOf } from "./price-terms";

export const HOME_SERVICE_LIMIT = 4;
export const HOME_PRODUCT_LIMIT = 8;
// Keeps the categories chapter within the chapter-motion trigger budget.
export const HOME_CATEGORY_LIMIT = 6;
export const AUTH_SERVICE_LIMIT = 5;
// Upper bound on the hero carousel so its rotation stays short however large
// the catalog grows.
export const HERO_SERVICE_LIMIT = 8;

// Home rail and hero both read the public catalog in one render; cache dedupes
// the call per request.
const getPublicCatalog = cache(listPublicCatalog);

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

// Categories for the home chapter: live ones that hold at least one bookable
// service, in the admin sort order (name breaks ties). serviceCount is
// replaced by the live count so the row never promises hidden services.
export function pickHomeCategories(
  categories: ServiceCategoryItem[],
  services: ServiceItem[],
  limit = HOME_CATEGORY_LIMIT,
): ServiceCategoryItem[] {
  const counts = countServicesByCategory(
    services.filter((service) => service.isActive && !service.isDeleted),
  );
  return categories
    .filter((category) => category.isActive && !category.isDeleted)
    .map((category) => ({
      ...category,
      serviceCount: counts.get(category.id) ?? 0,
    }))
    .filter((category) => category.serviceCount > 0)
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"),
    )
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

// Active services that have a catalog photo, alphabetical so the hero rotation
// keeps the same order on every render. An empty result means the hero renders
// text only.
export function pickHeroServices(
  services: ServiceItem[],
  limit = HERO_SERVICE_LIMIT,
): ServiceItem[] {
  return services
    .filter(
      (service) => service.isActive && !service.isDeleted && service.imageUrl,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "vi"))
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
  const result = await getPublicCatalog();
  return result.ok ? pickHomeServices(result.data.services, limit) : [];
}

async function loadHomeCategories(
  limit: number,
): Promise<ServiceCategoryItem[]> {
  const result = await getPublicCatalog();
  return result.ok
    ? pickHomeCategories(result.data.categories, result.data.services, limit)
    : [];
}

export async function listHomeCategories(
  limit = HOME_CATEGORY_LIMIT,
): Promise<ServiceCategoryItem[]> {
  try {
    return await Promise.race([
      loadHomeCategories(limit),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Home categories"),
    ]);
  } catch {
    return [];
  }
}

// /services/[slug] is a category tab, so a hero card links to the category its
// service belongs to. Null when that category is not public.
export type HeroService = ServiceItem & { categorySlug: string | null };

async function loadHeroServices(limit: number): Promise<HeroService[]> {
  const result = await getPublicCatalog();
  if (!result.ok) return [];
  const slugById = new Map(
    result.data.categories.map((category) => [category.id, category.slug]),
  );
  return pickHeroServices(result.data.services, limit).map((service) => ({
    ...service,
    categorySlug: slugById.get(service.categoryId) ?? null,
  }));
}

export async function listHeroServices(
  limit = HERO_SERVICE_LIMIT,
): Promise<HeroService[]> {
  try {
    return await Promise.race([
      loadHeroServices(limit),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Hero services"),
    ]);
  } catch {
    return [];
  }
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

async function loadHomePriceRange(): Promise<PriceRange | null> {
  const result = await getPublicCatalog();
  return result.ok ? priceRangeOf(result.data.services) : null;
}

// Catalog-wide price range for the price chapter (not just the home rows).
export async function listHomePriceRange(): Promise<PriceRange | null> {
  try {
    return await Promise.race([
      loadHomePriceRange(),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Home price range"),
    ]);
  } catch {
    return null;
  }
}
