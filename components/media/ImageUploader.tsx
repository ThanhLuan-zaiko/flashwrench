"use client";

import { useRef, useState } from "react";
import { FiImage, FiLoader, FiUpload } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useUploadMedia } from "@/hooks/media";
import {
  defaultMaxUploadBytes,
  isAllowedMediaMime,
  sniffImageMime,
} from "@/lib/media/media.validation";
import type { MediaAsset, MediaScope } from "@/services/media.api";
import { MediaApiError } from "@/services/media.api";
import { ImageCropDialog } from "./ImageCropDialog";

type ImageUploaderProps = {
  scope: MediaScope;
  ownerType: string;
  ownerId: string;
  label: string;
  hint?: string;
  cropTitle?: string;
  alt?: string;
  onUploaded: (asset: MediaAsset) => void;
};

function maxMbLabel(): string {
  return `${Math.round(defaultMaxUploadBytes() / 1024 / 1024)}MB`;
}

// Single-image upload button: pick, client pre-check, crop at full
// resolution, then POST. The parent decides what the asset means
// (avatar, service cover...); this component only delivers it.
export function ImageUploader({
  scope,
  ownerType,
  ownerId,
  label,
  hint,
  cropTitle = "Chỉnh sửa ảnh",
  alt,
  onUploaded,
}: ImageUploaderProps) {
  const toast = useToast();
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<{
    src: string;
    mime: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = upload.isPending;

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    if (!isAllowedMediaMime(file.type)) {
      setError("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > defaultMaxUploadBytes()) {
      setError(`Ảnh tối đa ${maxMbLabel()}.`);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (sniffImageMime(bytes) !== file.type) {
      setError("File không phải ảnh hợp lệ.");
      return;
    }
    const src = URL.createObjectURL(file);
    setDraft({ src, mime: file.type });
  }

  function closeDraft() {
    if (draft) URL.revokeObjectURL(draft.src);
    setDraft(null);
  }

  function handleCropped(
    blob: Blob,
    dims: { width: number; height: number; mime: string },
  ) {
    const src = draft?.src;
    setDraft(null);
    if (src) URL.revokeObjectURL(src);
    upload.mutate(
      {
        file: blob,
        scope,
        ownerType,
        ownerId,
        alt,
        width: dims.width,
        height: dims.height,
      },
      {
        onSuccess: (data) => {
          toast.success("Tải ảnh thành công", "Ảnh đã sẵn sàng để dùng.");
          onUploaded(data.asset);
          inputRef.current?.blur();
        },
        onError: (requestError) => {
          if (requestError instanceof MediaApiError) {
            setError(
              requestError.errors.file ??
                requestError.errors.form ??
                "Không tải được ảnh.",
            );
            toast.error(
              "Tải ảnh thất bại",
              requestError.errors.form ?? "Vui lòng thử lại.",
            );
          } else {
            setError("Không tải được ảnh. Vui lòng thử lại.");
            toast.error("Tải ảnh thất bại", "Vui lòng thử lại sau.");
          }
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={label}
        disabled={busy}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="hidden"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
      >
        {busy ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiUpload aria-hidden="true" className="h-4 w-4" />
        )}
        {busy ? "Đang tải ảnh…" : label}
      </button>
      <p className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <FiImage aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        {hint ??
          `JPEG, PNG hoặc WebP, tối đa ${maxMbLabel()}. Cắt giữ nguyên phân giải gốc.`}
      </p>
      {error && (
        <p
          role="alert"
          className="text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {draft && (
        <ImageCropDialog
          imageSrc={draft.src}
          sourceMime={draft.mime}
          title={cropTitle}
          onCancel={closeDraft}
          onConfirm={handleCropped}
        />
      )}
    </div>
  );
}
