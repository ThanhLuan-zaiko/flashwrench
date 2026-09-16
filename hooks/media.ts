"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/hooks/auth";
import type { UploadMediaInput } from "@/services/media.api";
import {
  deleteMediaRequest,
  setAvatarRequest,
  uploadMediaRequest,
} from "@/services/media.api";

export const mediaKeys = {
  all: ["media"] as const,
};

// Image upload: the file is already cropped at full resolution by the
// dialog, so no optimistic update — wait for the 201 asset instead.
export function useUploadMedia() {
  return useMutation({
    mutationFn: (input: UploadMediaInput) => uploadMediaRequest(input),
    retry: false,
  });
}

export function useDeleteMedia() {
  return useMutation({
    mutationFn: (assetId: string) => deleteMediaRequest(assetId),
    retry: false,
  });
}

// Pointing the profile at a new avatar changes the header immediately:
// invalidate the shared session so every consumer refetches the user.
export function useSetAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => setAvatarRequest(assetId),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
