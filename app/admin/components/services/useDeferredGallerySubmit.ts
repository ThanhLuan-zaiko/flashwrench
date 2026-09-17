"use client";

import type { MediaScope } from "@/services/media.api";
import type { StagedCover } from "./useStagedCovers";
import {
  type UploadedCover,
  useUploadStagedCovers,
} from "./useUploadStagedCovers";

export type { UploadedCover };

type DeferredGalleryOwner = {
  scope: MediaScope;
  ownerType: string;
  editingId: string | null;
  pendingOwnerId: string;
};

// Shared deferred save for catalog dialogs: staged blobs upload only on
// submit, then the caller persists the gallery payload. A failed upload
// aborts before any catalog row is written, so disk, registry and
// catalog never drift apart.
export function useDeferredGallerySubmit(args: {
  staged: StagedCover[];
  buildPayload: (uploaded: { id: string; url: string }[]) => string[];
  owner: DeferredGalleryOwner;
  onSave: (gallery: string[], uploaded: UploadedCover[]) => void;
}): {
  submit: () => void;
  uploading: boolean;
  uploadError: string | null;
} {
  const uploader = useUploadStagedCovers();
  const { staged, buildPayload, owner, onSave } = args;

  function submit() {
    void (async () => {
      let uploaded: UploadedCover[] = [];
      if (staged.length > 0) {
        try {
          uploaded = await uploader.uploadAll(staged, {
            scope: owner.scope,
            ownerType: owner.ownerType,
            ownerId: owner.editingId ?? owner.pendingOwnerId,
          });
        } catch {
          return;
        }
      }
      onSave(buildPayload(uploaded), uploaded);
    })();
  }

  return {
    submit,
    uploading: uploader.uploading,
    uploadError: uploader.uploadError,
  };
}
