import { FiMapPin } from "react-icons/fi";
import { boundingBoxAround } from "@/lib/mechanic/mechanic-geo";
import type {
  MechanicNavigationBoard,
  MechanicNavigationTarget,
} from "@/services/mechanic.api";

type MapPanelProps = {
  origin: MechanicNavigationBoard["origin"];
  target: MechanicNavigationTarget | null;
};

// Live map without any map SDK: an OpenStreetMap embed centered between the
// origin and the selected job. Links out to full maps for turn-by-turn.
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

  const center = origin
    ? { lat: (origin.lat + target.lat) / 2, lng: (origin.lng + target.lng) / 2 }
    : { lat: target.lat, lng: target.lng };
  const box = boundingBoxAround(center, 3);
  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${box.minLng}%2C${box.minLat}%2C${box.maxLng}%2C${box.maxLat}` +
    `&layer=mapnik&marker=${target.lat}%2C${target.lng}`;
  const openUrl = `https://www.openstreetmap.org/?mlat=${target.lat}&mlon=${target.lng}#map=15/${target.lat}/${target.lng}`;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <iframe
        title={`Bản đồ tới ${target.addressText}`}
        src={embedUrl}
        loading="lazy"
        className="h-72 w-full border-0 sm:h-80"
      />
      <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
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
