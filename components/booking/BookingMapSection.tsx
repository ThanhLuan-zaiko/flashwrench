"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FiLoader, FiMapPin, FiSearch } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useAddressSearch, useReverseGeocode } from "@/hooks/geocode";
import {
  defaultMapCenter,
  type GeocodeResult,
  type MapAddressValues,
} from "@/services/geocode.api";
import type { MapPoint } from "./MapPicker";

const MapPicker = dynamic(
  () => import("./MapPicker").then((module) => module.MapPicker),
  {
    ssr: false,
    loading: () => (
      <output
        aria-label="Đang tải bản đồ"
        className="block h-72 w-full animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
      />
    ),
  },
);

type BookingMapSectionProps = {
  lat: number | null;
  lng: number | null;
  error?: string;
  onCoords: (point: MapPoint) => void;
  onAddress: (values: MapAddressValues) => void;
};

// Map step: tap to pin or search an address, the address fields below
// fill in realtime from reverse geocoding. Typing stays available for
// alleys the map does not name well.
export function BookingMapSection({
  lat,
  lng,
  error,
  onCoords,
  onAddress,
}: BookingMapSectionProps) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<MapPoint>(() => defaultMapCenter());
  const [focusKey, setFocusKey] = useState(0);
  const [open, setOpen] = useState(false);
  const results = useAddressSearch(search);
  const reverse = useReverseGeocode();

  const marker: MapPoint | null =
    lat !== null && lng !== null ? { lat, lng } : null;

  function handlePick(point: MapPoint) {
    onCoords(point);
    reverse.mutate(point, {
      onSuccess: (values) => onAddress(values),
      onError: () => {
        toast.error("Không tra được địa chỉ", "Hãy nhập tay địa chỉ bên dưới.");
      },
    });
  }

  function handleSelect(result: GeocodeResult) {
    setView({ lat: result.lat, lng: result.lng });
    setFocusKey((key) => key + 1);
    setSearch("");
    setOpen(false);
    handlePick({ lat: result.lat, lng: result.lng });
  }

  const suggestions = results.data ?? [];

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Vị trí sửa xe trên bản đồ
      </p>
      <div className="relative">
        <FiSearch
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Tìm địa chỉ gọi thợ tới…"
          aria-label="Tìm địa chỉ gọi thợ tới"
          autoComplete="off"
          className="min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        {open && search.trim().length >= 3 && (
          <ul
            aria-label="Gợi ý địa chỉ"
            className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            {results.isPending && (
              <li className="flex items-center gap-2 px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 motion-safe:animate-spin"
                />
                Đang tìm địa chỉ…
              </li>
            )}
            {results.isSuccess &&
              suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(item)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-zinc-700 transition-colors duration-150 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <FiMapPin
                      aria-hidden="true"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    />
                    <span className="line-clamp-2">{item.label}</span>
                  </button>
                </li>
              ))}
            {results.isSuccess && suggestions.length === 0 && (
              <li className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                Không tìm thấy địa chỉ. Hãy chạm trực tiếp lên bản đồ.
              </li>
            )}
          </ul>
        )}
      </div>

      <MapPicker
        center={marker ?? view}
        marker={marker}
        focusKey={focusKey}
        onPick={handlePick}
      />

      <p
        aria-live="polite"
        className="text-[11px] text-zinc-500 dark:text-zinc-400"
      >
        {reverse.isPending
          ? "Đang tra địa chỉ cho điểm vừa ghim…"
          : marker
            ? `Đã ghim: ${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)} — chạm chỗ khác để dời ghim.`
            : "Chạm lên bản đồ để ghim nơi thợ tới, hoặc tìm địa chỉ ở trên."}
      </p>
      {error && (
        <p
          role="alert"
          className="text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
