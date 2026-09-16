import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";

export const PUBLIC_CATALOG_PAGE_SIZE = 8;

export type PublicCatalogFilter = {
  categoryId: string;
  query: string;
};

// Filter visible services by category then by a case-insensitive name or
// description match. Pure helper so the landing stays small and testable.
export function filterPublicServices(
  services: ServiceItem[],
  filter: PublicCatalogFilter,
): ServiceItem[] {
  const query = filter.query.trim().toLowerCase();
  return services.filter((service) => {
    if (filter.categoryId && service.categoryId !== filter.categoryId) {
      return false;
    }
    if (!query) return true;
    return (
      service.name.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query)
    );
  });
}

// Resolve the tab slug from the URL to a live category. Null means the
// "all" tab (/services); unknown slugs resolve to null so the landing can
// show a friendly "no longer available" panel instead of guessing.
export function resolveTabCategory(
  categories: ServiceCategoryItem[],
  slug: string | null,
): ServiceCategoryItem | null {
  if (!slug) return null;
  return categories.find((category) => category.slug === slug) ?? null;
}

export type PublicCatalogPage = {
  pageItems: ServiceItem[];
  pageCount: number;
  safePage: number;
  start: number;
  end: number;
  total: number;
};

// Clamp the page into range and slice one page of items.
export function paginatePublicServices(
  services: ServiceItem[],
  page: number,
  perPage: number = PUBLIC_CATALOG_PAGE_SIZE,
): PublicCatalogPage {
  const total = services.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  const startIndex = safePage * perPage;
  const pageItems = services.slice(startIndex, startIndex + perPage);
  return {
    pageItems,
    pageCount,
    safePage,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + perPage, total),
    total,
  };
}
