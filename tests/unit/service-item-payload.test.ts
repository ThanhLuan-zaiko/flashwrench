import { describe, expect, test } from "bun:test";
import type { ServiceItemFormFields } from "@/app/admin/components/services/service-item-payload";
import { buildServiceItemPayload } from "@/app/admin/components/services/service-item-payload";

// Payload contract behind the service item dialog: trimmed text, numeric
// fallbacks, first gallery entry becomes the cover, and the cover's
// assetId is looked up from the uploaded set. Pure helper, no mocks.
function makeFields(
  overrides?: Partial<ServiceItemFormFields>,
): ServiceItemFormFields {
  return {
    categoryId: "cat-1",
    name: "  Thay ắc quy  ",
    slug: " thay-ac-quy ",
    description: "  Mô tả  ",
    basePrice: "150000",
    priceUnit: "per_job",
    durationMin: "45",
    isHomeSupported: true,
    isEmergencySupported: false,
    isActive: true,
    ...overrides,
  };
}

describe("buildServiceItemPayload", () => {
  test("trims text fields and parses numbers", () => {
    const payload = buildServiceItemPayload(makeFields(), [], []);
    expect(payload.name).toBe("Thay ắc quy");
    expect(payload.slug).toBe("thay-ac-quy");
    expect(payload.description).toBe("Mô tả");
    expect(payload.basePrice).toBe(150000);
    expect(payload.durationMin).toBe(45);
  });

  test("first gallery entry becomes the cover with its assetId", () => {
    const payload = buildServiceItemPayload(
      makeFields(),
      ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
      [
        { id: "u1", url: "https://cdn.example.com/a.jpg", assetId: "asset-1" },
        { id: "u2", url: "https://cdn.example.com/b.jpg", assetId: "asset-2" },
      ],
    );
    expect(payload.imageUrl).toBe("https://cdn.example.com/a.jpg");
    expect(payload.imageAssetId).toBe("asset-1");
    expect(payload.images).toEqual([
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
    ]);
    expect(payload.imageAssetIds).toEqual(["asset-1", "asset-2"]);
  });

  test("falls back to 0 for unparseable numbers and blank cover", () => {
    const payload = buildServiceItemPayload(
      makeFields({ basePrice: "abc", durationMin: "" }),
      [],
      [],
    );
    expect(payload.basePrice).toBe(0);
    expect(payload.durationMin).toBe(0);
    expect(payload.imageUrl).toBe("");
    expect(payload.imageAssetId).toBeUndefined();
  });
});
