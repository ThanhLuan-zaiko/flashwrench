import type { CreatePartInput } from "@/lib/parts/parts.types";

// Request body -> service input for create and update. Lives outside
// route.ts because Next route files may only export HTTP handlers.
function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function toSpecsRecord(value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export function toPartInput(body: Record<string, unknown>): CreatePartInput {
  return {
    categoryId: String(body.categoryId ?? ""),
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    sku: String(body.sku ?? ""),
    brand: body.brand === undefined ? undefined : String(body.brand),
    price: Number(body.price),
    comparePrice:
      body.comparePrice === undefined ? undefined : Number(body.comparePrice),
    stockQty: Number(body.stockQty),
    carBrands: toStringArray(body.carBrands),
    carModels: toStringArray(body.carModels),
    images: toStringArray(body.images),
    imageAssetIds: toStringArray(body.imageAssetIds),
    specs: toSpecsRecord(body.specs),
    description:
      body.description === undefined ? undefined : String(body.description),
    isActive:
      body.isActive === undefined ? undefined : (body.isActive as boolean),
  };
}
