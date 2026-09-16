"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { ImageUploader } from "@/components/media/ImageUploader";
import { fieldError } from "./catalog-errors";

type CatalogImageFieldProps = {
  scope: "service" | "category";
  entityId: string | null;
  imageUrl: string;
  serverError: unknown;
  onChange: (imageUrl: string, assetId: string | null) => void;
};

// Shared cover-image field for the catalog dialogs. Uploads land in
// media storage immediately; the dialog submits imageUrl plus the fresh
// asset id, and the service re-points the asset at the real row on save.
// While creating (no row yet) uploads use a temporary owner id.
export function CatalogImageField({
  scope,
  entityId,
  imageUrl,
  serverError,
  onChange,
}: CatalogImageFieldProps) {
  const [pendingOwnerId] = useState(() => crypto.randomUUID());
  const error =
    fieldError(serverError, "imageUrl") ??
    fieldError(serverError, "imageAssetId");

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Ảnh bìa (tùy chọn)
      </span>
      {imageUrl && (
        <div className="relative">
          {/* biome-ignore lint/performance/noImgElement: dynamic cropped upload served immutable; next/image optimizer hop needs sharp for zero benefit. */}
          <img
            src={imageUrl}
            alt=""
            className="h-28 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
          />
          <button
            type="button"
            onClick={() => onChange("", null)}
            aria-label="Xóa ảnh bìa"
            className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 motion-safe:active:scale-95 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiTrash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
      <ImageUploader
        scope={scope}
        ownerType={scope}
        ownerId={entityId ?? pendingOwnerId}
        label={imageUrl ? "Đổi ảnh bìa" : "Tải ảnh bìa"}
        cropTitle="Cắt ảnh bìa"
        onUploaded={(asset) => onChange(asset.url, asset.assetId)}
      />
      {!entityId && (
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Ảnh sẽ gắn vào mục này sau khi bấm tạo.
        </span>
      )}
      {error && (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
