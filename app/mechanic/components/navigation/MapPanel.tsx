"use client";

import dynamic from "next/dynamic";
import { FiMapPin } from "react-icons/fi";
import type {
  MechanicNavigationBoard,
  MechanicNavigationTarget,
} from "@/services/mechanic.api";
import { googleMapViewUrl } from "./navigation-directions";

const TrackingMap = dynamic(
  () =>
    import("@/components/history/TrackingMap").then(
      (module) => module.TrackingMap,
    ),
  {
    ssr: false,
    loading: () => (
      <output
        aria-label="Đang tải bản đồ"
        className="block h-72 w-full animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 sm:h-80 dark:border-zinc-800 dark:bg-zinc-900"
      />
    ),
  },
);

type MapPanelProps = {
  origin: MechanicNavigationBoard["origin"];
  target: MechanicNavigationTarget | null;
};

// Leaflet preview of the selected job: the dark pin is the job site, the
// inverted pin is the mechanic's last saved position. "Mở bản đồ lớn"
// links out to Google Maps so it works where *.openstreetmap.org is
// blocked.
export function MapPanel({ origin, target }: MapPanelProps) {
  if (!target) {
    return (
      <div className="mt-3 flex min-h-48 items-center justify-center rounded-2xl border border-zinc-200 px-4 py-8 text-center dark:border-zinc-800">
        <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
          <FiMapPin
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-zinc-400"
          />
          <span className="mt-2 block font-semibold text-zinc-700 dark:text-zinc-300">
            Chưa chọn điểm đến
          </span>
          Bản đồ sẽ hiện khi bạn có đơn đang mở.
        </p>
      </div>
    );
  }

  const openUrl = googleMapViewUrl(target.lat, target.lng);

  return (
    <div className="mt-3 flex flex-col gap-2">
      <TrackingMap
        customer={{ lat: target.lat, lng: target.lng }}
        mechanic={origin ? { lat: origin.lat, lng: origin.lng } : null}
        mapClassName="h-72 w-full sm:h-80"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {target.addressText}
        </p>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-semibold text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-200"
        >
          Mở bản đồ lớn
        </a>
      </div>
    </div>
  );
}
