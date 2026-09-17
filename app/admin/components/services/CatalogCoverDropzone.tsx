"use client";

import { useRef } from "react";
import { FiImage, FiUpload } from "react-icons/fi";
import { maxUploadMbLabel } from "./cover-staging";

type CatalogCoverDropzoneProps = {
  dragging: boolean;
  disabled: boolean;
  canAddMore: boolean;
  total: number;
  onDragChange: (dragging: boolean) => void;
  onFiles: (files: File[]) => void;
};

// Drag-drop button for 1..N cover images. Drop only stages local
// previews; uploads run later in the dialog submit (deferred persist).
// One native button covers click, keyboard and drop in a single target.
export function CatalogCoverDropzone({
  dragging,
  disabled,
  canAddMore,
  total,
  onDragChange,
  onFiles,
}: CatalogCoverDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blocked = disabled || !canAddMore;

  return (
    <button
      type="button"
      disabled={blocked}
      aria-label="Kéo thả ảnh vào đây hoặc nhấn để chọn một hoặc nhiều ảnh bìa"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        if (!blocked) onDragChange(true);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!blocked) onDragChange(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        onDragChange(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDragChange(false);
        if (blocked) return;
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length > 0) void onFiles(files);
      }}
      className={`flex min-h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] ${
        dragging
          ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-900"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={blocked}
        aria-label="Chọn một hoặc nhiều ảnh bìa"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void onFiles(files);
        }}
        className="hidden"
      />
      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        <FiUpload aria-hidden="true" className="h-4 w-4 shrink-0" />
        {dragging ? "Thả ảnh để thêm" : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
      </span>
      <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <FiImage aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        {canAddMore
          ? `JPEG/PNG/WebP, tối đa ${maxUploadMbLabel()}/ảnh. Đã có ${total}/5 ảnh.`
          : "Đã đủ 5 ảnh. Xóa bớt trước khi thêm."}
      </span>
    </button>
  );
}
