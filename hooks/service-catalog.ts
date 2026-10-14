import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import type {
  CreateCategoryInput,
  CreateServiceInput,
  UpdateCategoryInput,
  UpdateServiceInput,
} from "@/services/service-catalog.api";
import {
  createCategoryRequest,
  createServiceRequest,
  fetchServiceCategories,
  fetchServices,
  hardDeleteCategoryRequest,
  hardDeleteServiceRequest,
  restoreCategoryRequest,
  restoreServiceRequest,
  softDeleteCategoryRequest,
  softDeleteServiceRequest,
  toggleCategoryActiveRequest,
  toggleServiceActiveRequest,
  updateCategoryRequest,
  updateServiceRequest,
} from "@/services/service-catalog.api";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const catalogKeys = {
  all: ["catalog"] as const,
  categories: (includeDeleted: boolean) =>
    ["catalog", "categories", { includeDeleted }] as const,
  services: (query: { includeDeleted: boolean; categoryId?: string }) =>
    ["catalog", "services", query] as const,
};

export function useServiceCategories(includeDeleted = false) {
  return useQuery({
    queryKey: catalogKeys.categories(includeDeleted),
    queryFn: () => fetchServiceCategories({ includeDeleted }),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCatalogServices(
  query: { includeDeleted?: boolean; categoryId?: string } = {},
) {
  const normalized = {
    includeDeleted: query.includeDeleted ?? false,
    categoryId: query.categoryId,
  };
  return useQuery({
    queryKey: catalogKeys.services(normalized),
    queryFn: () => fetchServices(normalized),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
  };
}

// Admin↔admin live: service edits publish service-catalog, so a second
// admin tab refreshes without reload. Writer tab already invalidates via
// onSuccess; this covers every other tab.
export function useCatalogRealtime(enabled = true) {
  const queryClient = useQueryClient();
  useRealtimeTopic(SERVICE_CATALOG_TOPIC, {
    enabled,
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: CreateCategoryInput) =>
      createCategoryRequest(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryInput;
    }) => updateCategoryRequest(id, payload),
    onSuccess: invalidate,
  });
}

export function usePatchCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({
      id,
      action,
      isActive,
    }: {
      id: string;
      action: "toggle" | "soft" | "restore";
      isActive?: boolean;
    }) => {
      if (action === "toggle")
        return toggleCategoryActiveRequest(id, isActive ?? true);
      if (action === "soft") return softDeleteCategoryRequest(id);
      return restoreCategoryRequest(id);
    },
    onSuccess: invalidate,
  });
}

export function useHardDeleteCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: string }) =>
      hardDeleteCategoryRequest(id, confirm),
    onSuccess: invalidate,
  });
}

export function useCreateService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: CreateServiceInput) => createServiceRequest(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateServiceInput;
    }) => updateServiceRequest(id, payload),
    onSuccess: invalidate,
  });
}

export function usePatchService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({
      id,
      action,
      isActive,
    }: {
      id: string;
      action: "toggle" | "soft" | "restore";
      isActive?: boolean;
    }) => {
      if (action === "toggle")
        return toggleServiceActiveRequest(id, isActive ?? true);
      if (action === "soft") return softDeleteServiceRequest(id);
      return restoreServiceRequest(id);
    },
    onSuccess: invalidate,
  });
}

export function useHardDeleteService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: string }) =>
      hardDeleteServiceRequest(id, confirm),
    onSuccess: invalidate,
  });
}
