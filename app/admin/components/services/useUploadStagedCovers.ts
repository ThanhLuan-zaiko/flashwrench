"use client";

import { useState } from "react";
import type { MediaScope } from "@/services/media.api";
import { MediaApiError, uploadMediaRequest } from "@/services/media.api";
import type { StagedCover } from "./useStagedCovers";

export type UploadedCover = {
  id: string;
  url: string;
  assetId: string;
};

// Deferred upload runner: staged blobs persist only when the dialog
// saves. Sequential uploads keep error mapping simple; a failure aborts
// the category save so disk, registry and catalog never drift apart.
export function useUploadStagedCovers() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadAll(
    staged: StagedCover[],
    target: { scope: MediaScope; ownerType: string; ownerId: string },
  ): Promise<UploadedCover[]> {
    setUploading(true);
    setUploadError(null);
    try {
      const out: UploadedCover[] = [];
      for (const item of staged) {
        const result = await uploadMediaRequest({
          file: item.blob,
          scope: target.scope,
          ownerType: target.ownerType,
          ownerId: target.ownerId,
          width: item.width ?? undefined,
          height: item.height ?? undefined,
        });
        out.push({
          id: item.id,
          url: result.asset.url,
          assetId: result.asset.assetId,
        });
      }
      return out;
    } catch (error) {
      const message =
        error instanceof MediaApiError
          ? (error.errors.file ?? error.errors.form ?? "Không tải được ảnh.")
          : "Không tải được ảnh. Vui lòng thử lại.";
      setUploadError(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  }

  return { uploading, uploadError, setUploadError, uploadAll };
}
