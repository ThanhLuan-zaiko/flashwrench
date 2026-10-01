"use client";

import { useState } from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useZoneMutation } from "@/hooks/admin-rescue";
import {
  AdminRescueApiError,
  type ZoneItem,
} from "@/services/admin-rescue.api";

export type ZoneDialogState =
  | { mode: "create" }
  | { mode: "edit"; item: ZoneItem };

const INPUT_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

// Zone create/edit dialog: name, city, center pin and radius. No delete:
// retiring uses the active toggle so history references stay valid.
export function ZoneDialog({
  state,
  onClose,
}: {
  state: ZoneDialogState;
  onClose: () => void;
}) {
  const toast = useToast();
  const save = useZoneMutation();
  const editing = state.mode === "edit" ? state.item : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [city, setCity] = useState(editing?.city ?? "");
  const [lat, setLat] = useState(editing?.centerLat?.toString() ?? "10.7769");
  const [lng, setLng] = useState(editing?.centerLng?.toString() ?? "106.7009");
  const [radius, setRadius] = useState(editing?.radiusKm?.toString() ?? "5");
  const [active, setActive] = useState(editing?.isActive ?? true);

  function handleSave() {
    save.mutate(
      {
        zoneId: editing?.zoneId,
        payload: {
          name: name.trim(),
          city: city.trim() || null,
          centerLat: Number(lat),
          centerLng: Number(lng),
          radiusKm: Number(radius),
          isActive: active,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            editing ? "Đã cập nhật khu vực" : "Đã thêm khu vực",
            name.trim(),
          );
          onClose();
        },
        onError: (error) => {
          const message =
            error instanceof AdminRescueApiError
              ? (error.errors.name ??
                error.errors.city ??
                error.errors.center ??
                error.errors.radiusKm ??
                error.errors.form ??
                "Vui lòng kiểm tra lại.")
              : "Vui lòng thử lại sau.";
          toast.error("Không lưu được", message);
        },
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa khu vực" : "Thêm khu vực"}
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {editing ? "Sửa khu vực" : "Thêm khu vực"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 sm:col-span-2 dark:text-zinc-300">
            Tên khu vực *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Quận 1 - TP Hồ Chí Minh"
              className={INPUT_CLASSES}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 sm:col-span-2 dark:text-zinc-300">
            Thành phố
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="TP Hồ Chí Minh"
              className={INPUT_CLASSES}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Vĩ độ tâm *
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Kinh độ tâm *
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Bán kính (km) *
            <input
              type="number"
              step="any"
              min={0.5}
              max={100}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 rounded accent-zinc-900 dark:accent-white"
            />
            Đang hoạt động
          </label>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={save.isPending || !name.trim()}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900"
        >
          {save.isPending ? (
            <>
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              Đang lưu…
            </>
          ) : (
            "Lưu khu vực"
          )}
        </button>
      </div>
    </div>
  );
}
