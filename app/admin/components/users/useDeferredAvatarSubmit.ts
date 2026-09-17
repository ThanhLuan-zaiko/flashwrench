"use client";

import type { MediaScope } from "@/services/media.api";
import type { StagedCover } from "../services/useStagedCovers";
import {
  type UploadedCover,
  useUploadStagedCovers,
} from "../services/useUploadStagedCovers";

export type { UploadedCover };

type DeferredAvatarOwner = {
  scope: MediaScope;
  ownerType: string;
  ownerId: string;
};

// Deferred save for the single staff avatar: the staged blob uploads
// only on submit, then the caller persists avatarAssetId. A failed
// upload aborts before any staff row is written, so disk, registry and
// users never drift apart. No staged photo means onSave(null) directly.
export function useDeferredAvatarSubmit(args: {
  staged: StagedCover | null;
  owner: DeferredAvatarOwner;
  onSave: (uploaded: UploadedCover | null) => void;
}): {
  submit: () => void;
  uploading: boolean;
  uploadError: string | null;
} {
  const uploader = useUploadStagedCovers();
  const { staged, owner, onSave } = args;

  function submit() {
    void (async () => {
      if (!staged) {
        onSave(null);
        return;
      }
      try {
        const uploaded = await uploader.uploadAll([staged], {
          scope: owner.scope,
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
        });
        onSave(uploaded[0] ?? null);
      } catch {
        return;
      }
    })();
  }

  return {
    submit,
    uploading: uploader.uploading,
    uploadError: uploader.uploadError,
  };
}
