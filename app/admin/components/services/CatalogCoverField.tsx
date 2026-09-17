"use client";

import { useState } from "react";
import { ImageCropDialog } from "@/components/media/ImageCropDialog";
import { CatalogCoverDropzone } from "./CatalogCoverDropzone";
import { CatalogCoverThumbs } from "./CatalogCoverThumbs";
import { fieldError } from "./catalog-errors";
import type { StagedCoversApi } from "./useStagedCovers";

type CatalogCoverFieldProps = {
  covers: StagedCoversApi;
  disabled: boolean;
  serverError: unknown;
  onFiles: (files: File[]) => void;
};

// Deferred cover gallery field: dropzone stages local thumbnails, crop
// edits staged blobs in memory, uploads run only on dialog save. Saved
// covers show real thumbnails; staged ones show pending previews.
export function CatalogCoverField({
  covers,
  disabled,
  serverError,
  onFiles,
}: CatalogCoverFieldProps) {
  const [croppingId, setCroppingId] = useState<string | null>(null);
  const cropping = covers.staged.find((s) => s.id === croppingId) ?? null;
  const error =
    covers.error ??
    fieldError(serverError, "imageUrl") ??
    fieldError(serverError, "images");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Ảnh bìa (tối đa 5, ảnh đầu là bìa chính)
      </span>
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <CatalogCoverThumbs
          existing={covers.existing}
          staged={covers.staged}
          pinnedCover={covers.pinnedCover}
          disabled={disabled}
          onMakeCover={covers.makeCover}
          onRemoveExisting={covers.removeExisting}
          onRemoveStaged={covers.removeStaged}
          onCropStaged={setCroppingId}
        />
        <CatalogCoverDropzone
          dragging={covers.dragging}
          disabled={disabled}
          canAddMore={covers.canAddMore}
          total={covers.total}
          onDragChange={covers.setDragging}
          onFiles={onFiles}
        />
      </div>
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Ảnh chỉ tải lên khi bấm lưu. Gắn sao để chọn bìa, bấm cắt để sửa từng
        ảnh chờ.
      </span>
      {error && (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
      {cropping && (
        <ImageCropDialog
          imageSrc={cropping.previewUrl}
          sourceMime={cropping.mime}
          title="Cắt ảnh bìa"
          onCancel={() => setCroppingId(null)}
          onConfirm={(blob, dims) => {
            covers.applyCrop(cropping.id, blob, dims);
            setCroppingId(null);
          }}
        />
      )}
    </div>
  );
}
