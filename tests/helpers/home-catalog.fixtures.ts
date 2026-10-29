import type { PartItem } from "@/lib/parts/parts.types";

// Storefront part builder for home-page tests. Defaults describe a live,
// in-stock, photographed part; override only the field a case cares about.
export function makePartItem(overrides?: Partial<PartItem>): PartItem {
  return {
    id: "part-1",
    sku: "SKU-1",
    name: "Má phanh trước",
    slug: "ma-phanh-truoc",
    brand: "Brembo",
    categoryId: "cat-1",
    categoryName: "Phanh",
    carBrands: [],
    carModels: [],
    price: 350000,
    comparePrice: 0,
    stockQty: 5,
    soldCount: 10,
    images: ["/media/part-1.jpg"],
    imageUrl: "/media/part-1.jpg",
    specs: {},
    description: "",
    ratingAvg: 4.5,
    ratingCount: 2,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    ...overrides,
  } as PartItem;
}
