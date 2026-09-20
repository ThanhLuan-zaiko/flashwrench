"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePartCategoryInput,
  CreatePartInput,
  UpdatePartCategoryInput,
  UpdatePartInput,
} from "@/services/admin-parts.api";
import {
  createPartCategoryRequest,
  createPartRequest,
  fetchAdminParts,
  fetchPartCategories,
  hardDeletePartCategoryRequest,
  hardDeletePartRequest,
  restorePartCategoryRequest,
  restorePartRequest,
  softDeletePartCategoryRequest,
  softDeletePartRequest,
  togglePartActiveRequest,
  togglePartCategoryActiveRequest,
  updatePartCategoryRequest,
  updatePartRequest,
} from "@/services/admin-parts.api";

export const adminPartsKeys = {
  all: ["admin-parts"] as const,
  categories: (includeDeleted: boolean) =>
    ["admin-parts", "categories", { includeDeleted }] as const,
  parts: (query: { includeDeleted: boolean; categoryId?: string }) =>
    ["admin-parts", "parts", query] as const,
};

export function useAdminPartCategories(includeDeleted = false) {
  return useQuery({
    queryKey: adminPartsKeys.categories(includeDeleted),
    queryFn: () => fetchPartCategories({ includeDeleted }),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useAdminParts(
  query: { includeDeleted?: boolean; categoryId?: string } = {},
) {
  const normalized = {
    includeDeleted: query.includeDeleted ?? false,
    categoryId: query.categoryId,
  };
  return useQuery({
    queryKey: adminPartsKeys.parts(normalized),
    queryFn: () => fetchAdminParts(normalized),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

function useInvalidateAdminParts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminPartsKeys.all });
  };
}

export function useCreatePartCategory() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: (payload: CreatePartCategoryInput) =>
      createPartCategoryRequest(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePartCategory() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePartCategoryInput;
    }) => updatePartCategoryRequest(id, payload),
    onSuccess: invalidate,
  });
}

export function useTogglePartCategoryActive() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      togglePartCategoryActiveRequest(id, isActive),
    onSuccess: invalidate,
  });
}

export function useSoftDeletePartCategory() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: (id: string) => softDeletePartCategoryRequest(id),
    onSuccess: invalidate,
  });
}

export function useRestorePartCategory() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: (id: string) => restorePartCategoryRequest(id),
    onSuccess: invalidate,
  });
}

export function useHardDeletePartCategory() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: string }) =>
      hardDeletePartCategoryRequest(id, confirm),
    onSuccess: invalidate,
  });
}

export function useCreatePart() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: (payload: CreatePartInput) => createPartRequest(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePart() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePartInput }) =>
      updatePartRequest(id, payload),
    onSuccess: invalidate,
  });
}

export function useTogglePartActive() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      togglePartActiveRequest(id, isActive),
    onSuccess: invalidate,
  });
}

export function useSoftDeletePart() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: (id: string) => softDeletePartRequest(id),
    onSuccess: invalidate,
  });
}

export function useRestorePart() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: (id: string) => restorePartRequest(id),
    onSuccess: invalidate,
  });
}

export function useHardDeletePart() {
  const invalidate = useInvalidateAdminParts();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: string }) =>
      hardDeletePartRequest(id, confirm),
    onSuccess: invalidate,
  });
}
