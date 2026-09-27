"use client";

import { useRef } from "react";
import { FiImage, FiX } from "react-icons/fi";
import { RETURN_IMAGE_MAX } from "@/lib/orders/order-return";

type ReturnPhotoPickerProps = {
  previews: string[];
  count: number;
  disabled: boolean;
  error?: string;
  onAdd: (list: FileList | null) => void;
  onRemove: (index: number) => void;
};

// Evidence-photo picker for the return dialog: thumbnail grid with
// per-photo remove plus a dashed add tile, capped at RETURN_IMAGE_MAX.
export function ReturnPhotoPicker({
  previews,
  count,
  disabled,
  error,
  onAdd,
  onRemove,
}: ReturnPhotoPickerProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Ảnh hiện trạng sản phẩm (bắt buộc, tối đa {RETURN_IMAGE_MAX})
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {previews.map((url, index) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Ảnh đổi trả ${index + 1}`}
              className="h-20 w-20 rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              aria-label={`Gỡ ảnh ${index + 1}`}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <FiX aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {count < RETURN_IMAGE_MAX && (
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            disabled={disabled}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 text-[10px] font-semibold text-zinc-500 transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <FiImage aria-hidden="true" className="h-5 w-5" />
            Thêm ảnh
          </button>
        )}
      </div>
      <input
        ref={pickerRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
