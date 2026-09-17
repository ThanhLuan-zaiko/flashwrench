"use client";

import { useRef, useState } from "react";
import { FiCrop, FiImage, FiUpload, FiUser, FiX } from "react-icons/fi";
import { ImageCropDialog } from "@/components/media/ImageCropDialog";
import { maxUploadMbLabel } from "../services/cover-staging";
import type { StagedAvatarApi } from "./useStagedAvatar";

type StaffAvatarFieldProps = {
  avatar: StagedAvatarApi;
  disabled: boolean;
  serverErrorText?: string | null;
  onFiles: (files: File[]) => void;
};

// Single staff photo field: current photo plus one pending preview.
// Files only stage local thumbnails; uploads run on dialog save like
// the catalog covers. Square crops display best everywhere.
export function StaffAvatarField({
  avatar,
  disabled,
  serverErrorText,
  onFiles,
}: StaffAvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState(false);
  const error = avatar.error ?? serverErrorText ?? null;
  const blocked = disabled || !avatar.canAddMore;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Ảnh thợ (tùy chọn, ảnh vuông hiển thị đẹp nhất)
      </span>
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        {avatar.existing && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
            {/* biome-ignore lint/performance/noImgElement: admin preview of stored media asset; optimizer adds no value here. */}
            <img
              src={avatar.existing}
              alt="Ảnh thợ hiện tại"
              className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                Ảnh hiện tại
              </span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {avatar.staged
                  ? "Ảnh mới sẽ thay ảnh này khi bấm lưu."
                  : "Giữ nguyên khi bấm lưu."}
              </span>
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={avatar.removeExisting}
              aria-label="Xóa ảnh thợ hiện tại"
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiX aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          </div>
        )}
        {avatar.staged && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
            {/* biome-ignore lint/performance/noImgElement: local object-URL preview before upload; next/image cannot handle blob URLs. */}
            <img
              src={avatar.staged.previewUrl}
              alt="Ảnh thợ chờ lưu"
              className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                Chờ lưu
              </span>
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {avatar.staged.name}
              </span>
            </span>
            <span className="flex shrink-0 items-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setCropping(true)}
                aria-label="Cắt ảnh thợ chờ lưu"
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <FiCrop aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Cắt</span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={avatar.removeStaged}
                aria-label="Xóa ảnh thợ chờ lưu"
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <FiX aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            </span>
          </div>
        )}
        {!avatar.existing && !avatar.staged && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 sm:h-20 sm:w-20 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <FiUser aria-hidden="true" className="h-6 w-6" />
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Chưa có ảnh. Thêm một ảnh vuông để khách dễ nhận diện thợ.
            </span>
          </div>
        )}
        <button
          type="button"
          disabled={blocked}
          aria-label="Kéo thả ảnh vào đây hoặc nhấn để chọn ảnh thợ"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!blocked) avatar.setDragging(true);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!blocked) avatar.setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            avatar.setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            avatar.setDragging(false);
            if (blocked) return;
            const files = Array.from(event.dataTransfer.files ?? []);
            if (files.length > 0) void onFiles(files);
          }}
          className={`flex min-h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] ${
            avatar.dragging
              ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-900"
              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={blocked}
            aria-label="Chọn ảnh thợ"
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
            {avatar.dragging
              ? "Thả ảnh để thêm"
              : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <FiImage aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {avatar.canAddMore
              ? `JPEG/PNG/WebP, tối đa ${maxUploadMbLabel()}/ảnh.`
              : "Đã có ảnh chờ. Xóa bớt trước khi thêm."}
          </span>
        </button>
      </div>
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Ảnh chỉ tải lên khi bấm lưu. Bấm cắt để sửa ảnh chờ thành vuông.
      </span>
      {error && (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
      {cropping && avatar.staged && (
        <ImageCropDialog
          imageSrc={avatar.staged.previewUrl}
          sourceMime={avatar.staged.mime}
          title="Cắt ảnh thợ"
          onCancel={() => setCropping(false)}
          onConfirm={(blob, dims) => {
            avatar.applyCrop(blob, dims);
            setCropping(false);
          }}
        />
      )}
    </div>
  );
}
