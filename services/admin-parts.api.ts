import type {
  CreatePartCategoryInput,
  CreatePartInput,
  PartCategoryItem,
  PartItem,
  UpdatePartCategoryInput,
  UpdatePartInput,
} from "@/lib/parts/parts.types";
import { apiRequest } from "./auth.api";

export type {
  CreatePartCategoryInput,
  CreatePartInput,
  PartCategoryItem,
  PartItem,
  UpdatePartCategoryInput,
  UpdatePartInput,
};

export function fetchPartCategories(
  options: { includeDeleted?: boolean } = {},
): Promise<{ categories: PartCategoryItem[] }> {
  const params = new URLSearchParams();
  if (options.includeDeleted) params.set("includeDeleted", "true");
  const qs = params.toString();
  return apiRequest<{ categories: PartCategoryItem[] }>(
    `/api/admin/part-categories${qs ? `?${qs}` : ""}`,
  );
}

export function createPartCategoryRequest(
  payload: CreatePartCategoryInput,
): Promise<{ category: PartCategoryItem }> {
  return apiRequest<{ category: PartCategoryItem }>(
    "/api/admin/part-categories",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updatePartCategoryRequest(
  id: string,
  payload: UpdatePartCategoryInput,
): Promise<{ category: PartCategoryItem }> {
  return apiRequest<{ category: PartCategoryItem }>(
    `/api/admin/part-categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action: "update", ...payload }) },
  );
}

export function togglePartCategoryActiveRequest(
  id: string,
  isActive: boolean,
): Promise<{ category: PartCategoryItem }> {
  return apiRequest<{ category: PartCategoryItem }>(
    `/api/admin/part-categories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggle-active", isActive }),
    },
  );
}

export function softDeletePartCategoryRequest(
  id: string,
): Promise<{ category: PartCategoryItem }> {
  return apiRequest<{ category: PartCategoryItem }>(
    `/api/admin/part-categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action: "soft-delete" }) },
  );
}

export function restorePartCategoryRequest(
  id: string,
): Promise<{ category: PartCategoryItem }> {
  return apiRequest<{ category: PartCategoryItem }>(
    `/api/admin/part-categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action: "restore" }) },
  );
}

export function hardDeletePartCategoryRequest(
  id: string,
  confirm: string,
): Promise<{ deleted: { id: string } }> {
  return apiRequest<{ deleted: { id: string } }>(
    `/api/admin/part-categories/${encodeURIComponent(id)}`,
    { method: "DELETE", body: JSON.stringify({ confirm }) },
  );
}

export function fetchAdminParts(
  options: { includeDeleted?: boolean; categoryId?: string } = {},
): Promise<{ parts: PartItem[] }> {
  const params = new URLSearchParams();
  if (options.includeDeleted) params.set("includeDeleted", "true");
  if (options.categoryId) params.set("categoryId", options.categoryId);
  const qs = params.toString();
  return apiRequest<{ parts: PartItem[] }>(
    `/api/admin/parts${qs ? `?${qs}` : ""}`,
  );
}

export function createPartRequest(
  payload: CreatePartInput,
): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>("/api/admin/parts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePartRequest(
  id: string,
  payload: UpdatePartInput,
): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>(
    `/api/admin/parts/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action: "update", ...payload }) },
  );
}

export function togglePartActiveRequest(
  id: string,
  isActive: boolean,
): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>(
    `/api/admin/parts/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggle-active", isActive }),
    },
  );
}

export function softDeletePartRequest(id: string): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>(
    `/api/admin/parts/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action: "soft-delete" }) },
  );
}

export function restorePartRequest(id: string): Promise<{ part: PartItem }> {
  return apiRequest<{ part: PartItem }>(
    `/api/admin/parts/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action: "restore" }) },
  );
}

export function hardDeletePartRequest(
  id: string,
  confirm: string,
): Promise<{ deleted: { id: string } }> {
  return apiRequest<{ deleted: { id: string } }>(
    `/api/admin/parts/${encodeURIComponent(id)}`,
    { method: "DELETE", body: JSON.stringify({ confirm }) },
  );
}
