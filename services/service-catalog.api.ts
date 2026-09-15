import type {
  CreateCategoryInput,
  CreateServiceInput,
  ServiceCategoryItem,
  ServiceItem,
  UpdateCategoryInput,
  UpdateServiceInput,
} from "@/lib/catalog/service-catalog.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type {
  CreateCategoryInput,
  CreateServiceInput,
  ServiceCategoryItem,
  ServiceItem,
  UpdateCategoryInput,
  UpdateServiceInput,
};
export { AuthApiError };

// Categories: list supports ?includeDeleted=true so the admin trash tab can
// show soft-deleted rows with a restore action.
export function fetchServiceCategories(query?: {
  includeDeleted?: boolean;
}): Promise<{
  categories: ServiceCategoryItem[];
}> {
  const suffix = query?.includeDeleted ? "?includeDeleted=true" : "";
  return apiRequest<{ categories: ServiceCategoryItem[] }>(
    `/api/admin/service-categories${suffix}`,
  );
}

export function createCategoryRequest(
  payload: CreateCategoryInput,
): Promise<{ category: ServiceCategoryItem }> {
  return apiRequest<{ category: ServiceCategoryItem }>(
    "/api/admin/service-categories",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateCategoryRequest(
  categoryId: string,
  payload: UpdateCategoryInput,
): Promise<{ category: ServiceCategoryItem }> {
  return apiRequest<{ category: ServiceCategoryItem }>(
    `/api/admin/service-categories/${encodeURIComponent(categoryId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "update", ...payload }) },
  );
}

export function toggleCategoryActiveRequest(
  categoryId: string,
  isActive: boolean,
): Promise<{ category: ServiceCategoryItem }> {
  return apiRequest<{ category: ServiceCategoryItem }>(
    `/api/admin/service-categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggle-active", isActive }),
    },
  );
}

export function softDeleteCategoryRequest(
  categoryId: string,
): Promise<{ category: ServiceCategoryItem }> {
  return apiRequest<{ category: ServiceCategoryItem }>(
    `/api/admin/service-categories/${encodeURIComponent(categoryId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "soft-delete" }) },
  );
}

export function restoreCategoryRequest(
  categoryId: string,
): Promise<{ category: ServiceCategoryItem }> {
  return apiRequest<{ category: ServiceCategoryItem }>(
    `/api/admin/service-categories/${encodeURIComponent(categoryId)}`,
    { method: "PATCH", body: JSON.stringify({ action: "restore" }) },
  );
}

export function hardDeleteCategoryRequest(
  categoryId: string,
  confirm: string,
): Promise<{ deleted: { id: string } }> {
  return apiRequest<{ deleted: { id: string } }>(
    `/api/admin/service-categories/${encodeURIComponent(categoryId)}`,
    { method: "DELETE", body: JSON.stringify({ confirm }) },
  );
}

// Services: same soft/hard split. Hard delete needs { confirm: slug }.
export type ServicesQuery = {
  includeDeleted?: boolean;
  categoryId?: string;
};

function toServicesQueryString(query: ServicesQuery): string {
  const params = new URLSearchParams();
  if (query.includeDeleted) params.set("includeDeleted", "true");
  if (query.categoryId) params.set("categoryId", query.categoryId);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function fetchServices(
  query: ServicesQuery = {},
): Promise<{ services: ServiceItem[] }> {
  return apiRequest<{ services: ServiceItem[] }>(
    `/api/admin/services${toServicesQueryString(query)}`,
  );
}

export function createServiceRequest(
  payload: CreateServiceInput,
): Promise<{ service: ServiceItem }> {
  return apiRequest<{ service: ServiceItem }>("/api/admin/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceRequest(
  serviceId: string,
  payload: UpdateServiceInput,
): Promise<{ service: ServiceItem }> {
  return apiRequest<{ service: ServiceItem }>(
    `/api/admin/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "update", ...payload }),
    },
  );
}

export function toggleServiceActiveRequest(
  serviceId: string,
  isActive: boolean,
): Promise<{ service: ServiceItem }> {
  return apiRequest<{ service: ServiceItem }>(
    `/api/admin/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggle-active", isActive }),
    },
  );
}

export function softDeleteServiceRequest(
  serviceId: string,
): Promise<{ service: ServiceItem }> {
  return apiRequest<{ service: ServiceItem }>(
    `/api/admin/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "soft-delete" }),
    },
  );
}

export function restoreServiceRequest(
  serviceId: string,
): Promise<{ service: ServiceItem }> {
  return apiRequest<{ service: ServiceItem }>(
    `/api/admin/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "restore" }),
    },
  );
}

export function hardDeleteServiceRequest(
  serviceId: string,
  confirm: string,
): Promise<{ deleted: { id: string } }> {
  return apiRequest<{ deleted: { id: string } }>(
    `/api/admin/services/${encodeURIComponent(serviceId)}`,
    { method: "DELETE", body: JSON.stringify({ confirm }) },
  );
}
