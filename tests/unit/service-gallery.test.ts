import { describe, expect, test } from "bun:test";
import { serviceImages } from "@/components/booking/service-gallery.utils";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Pure slide-list helper behind the booking gallery: cover first,
// gallery shots after, blanks dropped, duplicates removed. No React,
// no mocks.

function makeService(overrides?: Partial<ServiceItem>): ServiceItem {
  return {
    id: "svc-1",
    categoryId: "cat-1",
    categoryName: "Điện",
    name: "Thay ắc quy",
    slug: "thay-ac-quy",
    imageUrl: "",
    images: [],
    description: "",
    basePrice: 150000,
    priceUnit: "per_job",
    durationMin: 30,
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

describe("serviceImages", () => {
  test("returns an empty list without a service", () => {
    expect(serviceImages(null)).toEqual([]);
  });

  test("leads with the cover image then gallery shots", () => {
    const service = makeService({
      imageUrl: "https://cdn.example.com/cover.jpg",
      images: [
        "https://cdn.example.com/shot-1.jpg",
        "https://cdn.example.com/shot-2.jpg",
      ],
    });
    expect(serviceImages(service)).toEqual([
      "https://cdn.example.com/cover.jpg",
      "https://cdn.example.com/shot-1.jpg",
      "https://cdn.example.com/shot-2.jpg",
    ]);
  });

  test("falls back to gallery shots when the cover is blank", () => {
    const service = makeService({
      imageUrl: "  ",
      images: ["https://cdn.example.com/shot-1.jpg"],
    });
    expect(serviceImages(service)).toEqual([
      "https://cdn.example.com/shot-1.jpg",
    ]);
  });

  test("drops duplicates and blank entries", () => {
    const service = makeService({
      imageUrl: "https://cdn.example.com/cover.jpg",
      images: [
        "https://cdn.example.com/cover.jpg",
        "",
        "https://cdn.example.com/shot-1.jpg",
      ],
    });
    expect(serviceImages(service)).toEqual([
      "https://cdn.example.com/cover.jpg",
      "https://cdn.example.com/shot-1.jpg",
    ]);
  });
});
