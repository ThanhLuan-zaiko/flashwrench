import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import { type AuthApiError, apiRequest } from "./auth.api";

export type { AuthApiError };

export type PublicCatalogResponse = {
  categories: ServiceCategoryItem[];
  services: ServiceItem[];
};

// Public landing fetch: no auth needed, guests browse active prices only.
export function fetchPublicCatalog(): Promise<PublicCatalogResponse> {
  return apiRequest<PublicCatalogResponse>("/api/services");
}
