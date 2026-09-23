// Pure payload builder for the service item dialog: collects the raw text
// fields plus the resolved cover gallery into the API input. Numeric
// fields fall back to 0 so validation — not the dialog — reports mistakes.
import type {
  CreateServiceInput,
  PriceUnit,
} from "@/lib/catalog/service-catalog.types";
import type { UploadedCover } from "./useDeferredGallerySubmit";

export type ServiceItemFormFields = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  priceUnit: PriceUnit;
  durationMin: string;
  isHomeSupported: boolean;
  isEmergencySupported: boolean;
  isActive: boolean;
};

export function buildServiceItemPayload(
  fields: ServiceItemFormFields,
  gallery: string[],
  uploaded: UploadedCover[],
): CreateServiceInput {
  const coverUrl = gallery[0] ?? "";
  return {
    categoryId: fields.categoryId,
    name: fields.name.trim(),
    slug: fields.slug.trim(),
    imageUrl: coverUrl,
    imageAssetId: uploaded.find((u) => u.url === coverUrl)?.assetId,
    images: gallery,
    imageAssetIds: uploaded.map((u) => u.assetId),
    description: fields.description.trim(),
    basePrice: Number.parseInt(fields.basePrice, 10) || 0,
    priceUnit: fields.priceUnit,
    durationMin: Number.parseInt(fields.durationMin, 10) || 0,
    isHomeSupported: fields.isHomeSupported,
    isEmergencySupported: fields.isEmergencySupported,
    isActive: fields.isActive,
  };
}
