import { describe, expect, test } from "bun:test";
import { toServiceSelectOptions } from "@/components/booking/service-select-options";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Pure mapper behind the booking service picker: catalog rows become
// shared dropdown options with category, name and formatted price.

function makeService(overrides?: Partial<ServiceItem>): ServiceItem {
  return {
    id: "service-1",
    categoryId: "category-1",
    categoryName: "Bảo dưỡng",
    name: "Thay dầu động cơ",
    slug: "thay-dau-dong-co",
    imageUrl: "",
    images: [],
    description: "",
    basePrice: 250000,
    priceUnit: "per_job",
    durationMin: 45,
    isHomeSupported: true,
    isEmergencySupported: false,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe("toServiceSelectOptions", () => {
  test("returns empty for an empty catalog", () => {
    expect(toServiceSelectOptions([])).toEqual([]);
  });

  test("maps id and formats the Vietnamese label", () => {
    expect(toServiceSelectOptions([makeService()])).toEqual([
      {
        value: "service-1",
        label: "Bảo dưỡng — Thay dầu động cơ (250.000đ)",
      },
    ]);
  });

  test("preserves catalog order", () => {
    const services = [
      makeService({ id: "service-1", name: "Thay dầu động cơ" }),
      makeService({
        id: "service-2",
        categoryName: "Cứu hộ",
        name: "Kích bình ắc quy",
        basePrice: 150000,
      }),
    ];
    expect(toServiceSelectOptions(services).map((o) => o.value)).toEqual([
      "service-1",
      "service-2",
    ]);
  });
});
