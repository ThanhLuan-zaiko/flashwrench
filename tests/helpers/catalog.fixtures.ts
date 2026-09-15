import type {
  CreateCategoryInput,
  CreateServiceInput,
  ServiceCategoryRow,
  ServiceRow,
} from "@/lib/catalog/service-catalog.types";

// Builders for the catalog suites. Each test derives its own rows instead
// of mutating shared objects, mirroring tests/helpers/auth.fixtures.ts.

export function makeCategoryRow(
  overrides?: Partial<ServiceCategoryRow>,
): ServiceCategoryRow {
  return {
    category_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Bao duong tai nha",
    slug: "bao-duong-tai-nha",
    icon: "",
    description: "Thay dau, loc gio.",
    sort_order: 1,
    is_active: true,
    is_deleted: false,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  };
}

export function makeServiceRow(overrides?: Partial<ServiceRow>): ServiceRow {
  return {
    service_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    category_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    category_name: "Bao duong tai nha",
    name: "Thay dau dong co",
    slug: "thay-dau-dong-co",
    description: "Gom cong thay.",
    base_price: 199000,
    price_unit: "per_job",
    duration_min: 60,
    is_home_supported: true,
    is_emergency_supported: false,
    is_active: true,
    is_deleted: false,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  };
}

export function makeCategoryInput(
  overrides?: Partial<CreateCategoryInput>,
): CreateCategoryInput {
  return {
    name: "Sua chua luu dong",
    slug: "sua-chua-luu-dong",
    icon: "",
    description: "Phanh, ac quy, lop.",
    sortOrder: 2,
    isActive: true,
    ...overrides,
  };
}

export function makeServiceInput(
  overrides?: Partial<CreateServiceInput>,
): CreateServiceInput {
  return {
    categoryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Thay binh ac quy",
    slug: "thay-binh-ac-quy",
    description: "Binh 12V.",
    basePrice: 1290000,
    priceUnit: "per_job",
    durationMin: 45,
    isHomeSupported: true,
    isEmergencySupported: true,
    isActive: true,
    ...overrides,
  };
}
