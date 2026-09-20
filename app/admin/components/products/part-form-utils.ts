// Pure helpers for the part dialog: CSV-style lists (car brands, models),
// the `key: value`-per-line specs editor and the submit payload builder.
import type { CreatePartInput, PartItem } from "@/lib/parts/parts.types";

export function parseCsv(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function csvToText(items: string[]): string {
  return items.join(", ");
}

// Parse "key: value" lines into a specs record. Lines without a colon or
// with an empty key are skipped so partial edits never produce junk keys.
export function parseSpecsText(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

export function specsToText(specs: Record<string, string>): string {
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export type PartFormFields = {
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  price: string;
  comparePrice: string;
  stockQty: string;
  carBrands: string;
  carModels: string;
  specsText: string;
  description: string;
  isActive: boolean;
};

// Collect the raw text fields into the API payload. Numeric fields fall
// back to 0 so validation — not the dialog — reports the mistake.
export function buildPartPayload(
  fields: PartFormFields,
  gallery: string[],
  uploadedAssetIds: string[],
): CreatePartInput {
  return {
    categoryId: fields.categoryId,
    name: fields.name.trim(),
    slug: fields.slug.trim(),
    sku: fields.sku.trim(),
    brand: fields.brand.trim(),
    price: Number.parseInt(fields.price, 10) || 0,
    comparePrice: Number.parseInt(fields.comparePrice, 10) || 0,
    stockQty: Number.parseInt(fields.stockQty, 10) || 0,
    carBrands: parseCsv(fields.carBrands),
    carModels: parseCsv(fields.carModels),
    specs: parseSpecsText(fields.specsText),
    description: fields.description.trim(),
    images: gallery,
    imageAssetIds: uploadedAssetIds,
    isActive: fields.isActive,
  };
}

// Unsaved-changes guard: any field differing from the editing item (or the
// create-mode defaults) marks the form dirty, as does a staged gallery.
export function isPartFormDirty(
  fields: PartFormFields,
  editing: PartItem | null,
  fallbackCategoryId: string,
  galleryDirty: boolean,
  pending: boolean,
): boolean {
  if (pending) return true;
  return (
    fields.categoryId !== (editing?.categoryId ?? fallbackCategoryId) ||
    fields.name !== (editing?.name ?? "") ||
    fields.slug !== (editing?.slug ?? "") ||
    fields.sku !== (editing?.sku ?? "") ||
    fields.brand !== (editing?.brand ?? "") ||
    fields.price !== String(editing?.price ?? "") ||
    fields.comparePrice !==
      (editing?.comparePrice ? String(editing.comparePrice) : "") ||
    fields.stockQty !== String(editing?.stockQty ?? 0) ||
    fields.isActive !== (editing?.isActive ?? true) ||
    fields.carBrands !== csvToText(editing?.carBrands ?? []) ||
    fields.carModels !== csvToText(editing?.carModels ?? []) ||
    fields.specsText !== specsToText(editing?.specs ?? {}) ||
    fields.description !== (editing?.description ?? "") ||
    galleryDirty
  );
}

export function partSubmitLabel(
  uploading: boolean,
  pending: boolean,
  editing: boolean,
): string {
  if (uploading) return "Đang tải ảnh…";
  if (pending) return "Đang lưu…";
  return editing ? "Lưu thay đổi" : "Tạo sản phẩm";
}
