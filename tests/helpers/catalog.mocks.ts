// Shared repository stubs for the catalog suites (service-categories +
// services). Same pattern as the auth stubs: tests mutate `catalogStubs`
// and assert on `mock.calls`. Nothing touches a real database. Extend
// these handles instead of inventing file-local mocks for the same
// modules.
import { mock } from "bun:test";
import type {
  ServiceByCategoryRow,
  ServiceCategoryRow,
  ServiceRow,
} from "@/lib/catalog/service-catalog.types";

// Mutable stub state for the catalog suites (service-categories + services).
// Same pattern as the auth stubs above: tests mutate `catalogStubs` and
// assert on `mock.calls`. Nothing touches a real database.
export const catalogStubs = {
  categoryRows: [] as ServiceCategoryRow[],
  categoryById: null as ServiceCategoryRow | null,
  categorySlugOwner: null as string | null,
  categorySlugClaimed: true,
  serviceRows: [] as ServiceRow[],
  serviceById: null as ServiceRow | null,
  serviceSlugOwner: null as string | null,
  serviceSlugClaimed: true,
  serviceByCategoryRows: [] as ServiceByCategoryRow[],
};

export const categoryRepoMocks = {
  listCategoryRows: mock(
    async (): Promise<ServiceCategoryRow[]> => catalogStubs.categoryRows,
  ),
  findCategoryRowById: mock(
    async (_categoryId: string): Promise<ServiceCategoryRow | null> =>
      catalogStubs.categoryById,
  ),
  findCategoryIdBySlug: mock(
    async (_slug: string): Promise<string | null> =>
      catalogStubs.categorySlugOwner,
  ),
  insertCategory: mock(async (_params: unknown): Promise<void> => undefined),
  updateCategoryRow: mock(async (_params: unknown): Promise<void> => undefined),
  claimCategorySlug: mock(
    async (_slug: string, _categoryId: string): Promise<boolean> =>
      catalogStubs.categorySlugClaimed,
  ),
  releaseCategorySlug: mock(
    async (_slug: string, _categoryId: string): Promise<boolean> => true,
  ),
  setCategoryActive: mock(
    async (
      _categoryId: string,
      _isActive: boolean,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  setCategoryDeleted: mock(
    async (
      _categoryId: string,
      _isDeleted: boolean,
      _deletedAt: Date | null,
      _updatedAt: Date,
    ): Promise<void> => undefined,
  ),
  hardDeleteCategory: mock(
    async (_categoryId: string, _slug: string): Promise<void> => undefined,
  ),
};

export const catalogServiceRepoMocks = {
  listServiceRows: mock(
    async (): Promise<ServiceRow[]> => catalogStubs.serviceRows,
  ),
  findServiceRowById: mock(
    async (_serviceId: string): Promise<ServiceRow | null> =>
      catalogStubs.serviceById,
  ),
  findServiceIdBySlug: mock(
    async (_slug: string): Promise<string | null> =>
      catalogStubs.serviceSlugOwner,
  ),
  listServiceRowsByCategory: mock(
    async (_categoryId: string): Promise<ServiceByCategoryRow[]> =>
      catalogStubs.serviceByCategoryRows,
  ),
  insertService: mock(async (_params: unknown): Promise<void> => undefined),
  updateServiceRows: mock(async (_params: unknown): Promise<void> => undefined),
  setServiceActive: mock(
    async (
      _serviceId: string,
      _categoryId: string,
      _isActive: boolean,
    ): Promise<void> => undefined,
  ),
  setServiceDeleted: mock(
    async (
      _serviceId: string,
      _categoryId: string,
      _isDeleted: boolean,
      _deletedAt: Date | null,
    ): Promise<void> => undefined,
  ),
  hardDeleteService: mock(
    async (
      _serviceId: string,
      _categoryId: string,
      _slug: string,
    ): Promise<void> => undefined,
  ),
  claimServiceSlug: mock(
    async (_slug: string, _serviceId: string): Promise<boolean> =>
      catalogStubs.serviceSlugClaimed,
  ),
  releaseServiceSlug: mock(
    async (_slug: string, _serviceId: string): Promise<boolean> => true,
  ),
  bulkRefreshServiceCategoryName: mock(
    async (_serviceIds: string[], _categoryName: string): Promise<void> =>
      undefined,
  ),
};

export function resetCatalogMocks(): void {
  catalogStubs.categoryRows = [];
  catalogStubs.categoryById = null;
  catalogStubs.categorySlugOwner = null;
  catalogStubs.categorySlugClaimed = true;
  catalogStubs.serviceRows = [];
  catalogStubs.serviceById = null;
  catalogStubs.serviceSlugOwner = null;
  catalogStubs.serviceSlugClaimed = true;
  catalogStubs.serviceByCategoryRows = [];
  for (const fn of Object.values(categoryRepoMocks)) fn.mockClear();
  for (const fn of Object.values(catalogServiceRepoMocks)) fn.mockClear();
}
