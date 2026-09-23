"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { FiCheck, FiLoader, FiRotateCw, FiX, FiZoomIn } from "react-icons/fi";
import { cropImageToBlob } from "./image-crop";

export type AspectPreset = { label: string; value: number | null };

export const ASPECT_PRESETS: AspectPreset[] = [
  { label: "Vuông 1:1", value: 1 },
  { label: "Ngang 4:3", value: 4 / 3 },
  { label: "Rộng 16:9", value: 16 / 9 },
  { label: "Tự do", value: null },
];

type ImageCropDialogProps = {
  imageSrc: string;
  sourceMime: string;
  title: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (
    blob: Blob,
    dims: { width: number; height: number; mime: string },
  ) => void;
};

// Crop editor dialog: zoom, rotate and aspect presets. The confirmed
// blob keeps the full resolution of the cropped area — the server
// stores it as-is, never recompressed to a smaller size.
export function ImageCropDialog({
  imageSrc,
  sourceMime,
  title,
  confirmLabel = "Cắt & dùng ảnh này",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | null>(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!pixels || working) return;
    setWorking(true);
    setError(null);
    try {
      const cropped = await cropImageToBlob(
        imageSrc,
        pixels,
        sourceMime,
        rotation,
      );
      onConfirm(cropped.blob, {
        width: cropped.width,
        height: cropped.height,
        mime: cropped.mime,
      });
    } catch {
      setError("Không cắt được ảnh. Vui lòng thử lại.");
      setWorking(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex h-dvh items-center justify-center p-4"
    >
      <div aria-hidden="true" className="fixed inset-0 bg-zinc-950/50" />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl md:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng trình sửa ảnh"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-zinc-950 sm:h-72">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, areaPixels) => setPixels(areaPixels)}
          />
        </div>

        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="mb-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Tỉ lệ khung hình
          </legend>
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setAspect(preset.value)}
              aria-pressed={aspect === preset.value}
              className={`min-h-[36px] rounded-lg border px-3 text-xs font-semibold transition-colors duration-200 ${
                aspect === preset.value
                  ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </fieldset>

        <div className="flex items-center gap-2">
          <FiZoomIn
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-zinc-500"
          />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Mức thu phóng"
            className="h-[44px] w-full accent-zinc-900 dark:accent-white"
          />
          <button
            type="button"
            onClick={() => setRotation((value) => (value + 90) % 360)}
            aria-label="Xoay ảnh 90 độ"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-zinc-300 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <FiRotateCw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!pixels || working}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {working ? (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            ) : (
              <FiCheck aria-hidden="true" className="h-4 w-4" />
            )}
            {working ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
