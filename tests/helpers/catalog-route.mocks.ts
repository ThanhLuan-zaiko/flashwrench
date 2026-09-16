import { mock } from "bun:test";
import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";

// Stubs for the service-catalog admin routes and the public catalog route.
// Each test sets the result the service should return; assertions check the
// status passthrough and whether a catalog-updated event left the server
// (success only). Split from route-mocks.ts to respect file line limits.

export type CatalogRouteResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: Record<string, string> };

export function okCategoryItem(): ServiceCategoryItem {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Bao duong tai nha",
    slug: "bao-duong-tai-nha",
    icon: "",
    description: "Thay dau, loc gio.",
    sortOrder: 1,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
    serviceCount: 0,
  };
}

export function okServiceItem(): ServiceItem {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    categoryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    categoryName: "Bao duong tai nha",
    name: "Thay dau dong co",
    slug: "thay-dau-dong-co",
    description: "Gom cong thay.",
    basePrice: 199000,
    priceUnit: "per_job",
    durationMin: 60,
    isHomeSupported: true,
    isEmergencySupported: false,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
  };
}

export const catalogRouteStubs = {
  categoryResult: null as CatalogRouteResult<ServiceCategoryItem> | null,
  serviceResult: null as CatalogRouteResult<ServiceItem> | null,
  deletedResult: null as CatalogRouteResult<{ id: string }> | null,
  publicCatalogResult: null as CatalogRouteResult<{
    categories: ServiceCategoryItem[];
    services: ServiceItem[];
  }> | null,
  publicCatalogThrows: false,
};

export const serviceCategoryRouteMocks = {
  listServiceCategories: mock(
    async (): Promise<CatalogRouteResult<ServiceCategoryItem[]>> => ({
      ok: true,
      data: [okCategoryItem()],
    }),
  ),
  createServiceCategory: mock(
    async (): Promise<CatalogRouteResult<ServiceCategoryItem>> =>
      catalogRouteStubs.categoryResult ?? {
        ok: true,
        data: okCategoryItem(),
      },
  ),
  updateServiceCategory: mock(
    async (): Promise<CatalogRouteResult<ServiceCategoryItem>> =>
      catalogRouteStubs.categoryResult ?? {
        ok: true,
        data: okCategoryItem(),
      },
  ),
  toggleCategoryActive: mock(
    async (): Promise<CatalogRouteResult<ServiceCategoryItem>> =>
      catalogRouteStubs.categoryResult ?? {
        ok: true,
        data: okCategoryItem(),
      },
  ),
  softDeleteCategory: mock(
    async (): Promise<CatalogRouteResult<ServiceCategoryItem>> =>
      catalogRouteStubs.categoryResult ?? {
        ok: true,
        data: okCategoryItem(),
      },
  ),
  restoreCategory: mock(
    async (): Promise<CatalogRouteResult<ServiceCategoryItem>> =>
      catalogRouteStubs.categoryResult ?? {
        ok: true,
        data: okCategoryItem(),
      },
  ),
  hardDeleteCategoryWithConfirm: mock(
    async (): Promise<CatalogRouteResult<{ id: string }>> =>
      catalogRouteStubs.deletedResult ?? {
        ok: true,
        data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      },
  ),
};

export const catalogServiceRouteMocks = {
  listServices: mock(
    async (): Promise<CatalogRouteResult<ServiceItem[]>> => ({
      ok: true,
      data: [okServiceItem()],
    }),
  ),
  createService: mock(
    async (): Promise<CatalogRouteResult<ServiceItem>> =>
      catalogRouteStubs.serviceResult ?? { ok: true, data: okServiceItem() },
  ),
  updateService: mock(
    async (): Promise<CatalogRouteResult<ServiceItem>> =>
      catalogRouteStubs.serviceResult ?? { ok: true, data: okServiceItem() },
  ),
  toggleServiceActive: mock(
    async (): Promise<CatalogRouteResult<ServiceItem>> =>
      catalogRouteStubs.serviceResult ?? { ok: true, data: okServiceItem() },
  ),
  softDeleteService: mock(
    async (): Promise<CatalogRouteResult<ServiceItem>> =>
      catalogRouteStubs.serviceResult ?? { ok: true, data: okServiceItem() },
  ),
  restoreService: mock(
    async (): Promise<CatalogRouteResult<ServiceItem>> =>
      catalogRouteStubs.serviceResult ?? { ok: true, data: okServiceItem() },
  ),
  hardDeleteServiceWithConfirm: mock(
    async (): Promise<CatalogRouteResult<{ id: string }>> =>
      catalogRouteStubs.deletedResult ?? {
        ok: true,
        data: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
      },
  ),
};

export const publicCatalogRouteMocks = {
  listPublicCatalog: mock(
    async (): Promise<
      CatalogRouteResult<{
        categories: ServiceCategoryItem[];
        services: ServiceItem[];
      }>
    > => {
      if (catalogRouteStubs.publicCatalogThrows) throw new Error("db down");
      return (
        catalogRouteStubs.publicCatalogResult ?? {
          ok: true,
          data: { categories: [okCategoryItem()], services: [okServiceItem()] },
        }
      );
    },
  ),
};

export function resetCatalogRouteMocks(): void {
  catalogRouteStubs.categoryResult = null;
  catalogRouteStubs.serviceResult = null;
  catalogRouteStubs.deletedResult = null;
  catalogRouteStubs.publicCatalogResult = null;
  catalogRouteStubs.publicCatalogThrows = false;
  for (const fn of Object.values(serviceCategoryRouteMocks)) fn.mockClear();
  for (const fn of Object.values(catalogServiceRouteMocks)) fn.mockClear();
  for (const fn of Object.values(publicCatalogRouteMocks)) fn.mockClear();
}
