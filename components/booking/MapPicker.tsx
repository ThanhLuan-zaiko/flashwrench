"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export type MapPoint = { lat: number; lng: number };

type MapPickerProps = {
  center: MapPoint;
  marker: MapPoint | null;
  focusKey: number;
  onPick: (point: MapPoint) => void;
};

function roundPoint(point: MapPoint): MapPoint {
  return {
    lat: Math.round(point.lat * 1e6) / 1e6,
    lng: Math.round(point.lng * 1e6) / 1e6,
  };
}

// Plain div pin: Leaflet's default image marker needs bundler asset
// rewiring in Next.js, a div icon needs none. Tailwind classes inside
// the html string are picked up by the automatic content detection.
function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: '<span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-zinc-900 dark:bg-white"><span class="h-2.5 w-2.5 rounded-full bg-white dark:bg-zinc-900"></span></span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function ClickCatcher({ onPick }: { onPick: (point: MapPoint) => void }) {
  useMapEvents({
    click(event) {
      onPick(roundPoint({ lat: event.latlng.lat, lng: event.latlng.lng }));
    },
  });
  return null;
}

// Flies only when a search result is chosen (focusKey bump), never while
// the customer pans: following every center change would fight the user.
function FlyTo({ center, focusKey }: { center: MapPoint; focusKey: number }) {
  const map = useMap();
  const flown = useRef(focusKey);
  useEffect(() => {
    if (focusKey !== flown.current) {
      flown.current = focusKey;
      map.flyTo([center.lat, center.lng], 16);
    }
  }, [center, focusKey, map]);
  return null;
}

// Leaflet renders client-side only (loaded through next/dynamic with
// ssr:false). The z-0 wrapper owns a stacking context so map panes stay
// under the sticky site header instead of bleeding over it.
export function MapPicker({
  center,
  marker,
  focusKey,
  onPick,
}: MapPickerProps) {
  const icon = useMemo(() => pinIcon(), []);
  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom
        className="h-72 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCatcher onPick={onPick} />
        <FlyTo center={center} focusKey={focusKey} />
        {marker && (
          <Marker
            position={[marker.lat, marker.lng]}
            icon={icon}
            draggable
            eventHandlers={{
              dragend(event) {
                const target = event.target as L.Marker;
                const point = target.getLatLng();
                onPick(roundPoint({ lat: point.lat, lng: point.lng }));
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
