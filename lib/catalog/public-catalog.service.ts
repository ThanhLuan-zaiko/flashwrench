// Public catalog for the /services landing page. Only active, non-deleted
// rows are exposed, and a service is visible only when its parent category
// is also active and live. Sorted like the admin overview (categories by
// sort order, services by Vietnamese name).

import type {
  CatalogFieldErrors,
  ServiceCategoryItem,
  ServiceItem,
} from "./service-catalog.types";
import { listServiceCategories } from "./service-categories.service";
import { listServices } from "./services.service";

export type PublicCatalog = {
  categories: ServiceCategoryItem[];
  services: ServiceItem[];
};

export type PublicCatalogResult =
  | { ok: true; data: PublicCatalog }
  | { ok: false; status: number; errors: CatalogFieldErrors };

export async function listPublicCatalog(): Promise<PublicCatalogResult> {
  const [categoriesResult, servicesResult] = await Promise.all([
    listServiceCategories(),
    listServices(),
  ]);
  if (!categoriesResult.ok) return categoriesResult;
  if (!servicesResult.ok) return servicesResult;

  const categories = categoriesResult.data.filter(
    (c) => c.isActive && !c.isDeleted,
  );
  const liveCategoryIds = new Set(categories.map((c) => c.id));
  const services = servicesResult.data.filter(
    (s) => s.isActive && !s.isDeleted && liveCategoryIds.has(s.categoryId),
  );
  return { ok: true, data: { categories, services } };
}
