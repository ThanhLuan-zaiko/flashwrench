"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { defaultMapCenter } from "@/services/geocode.api";

export type TrackPoint = { lat: number; lng: number };

type TrackingMapProps = {
  customer: TrackPoint | null;
  mechanic: TrackPoint | null;
  route?: TrackPoint[];
};

function destinationIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: '<span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-zinc-900 dark:bg-white"><span class="h-2.5 w-2.5 rounded-full bg-white dark:bg-zinc-900"></span></span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function mechanicIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: '<span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-900 bg-white dark:border-white dark:bg-zinc-900"><span class="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-white"></span></span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Keeps both pins in view as the mechanic moves; re-fits only when the
// mechanic's coordinates actually change.
function FitBounds({ customer, mechanic, route }: TrackingMapProps) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = route?.length
      ? route.map((point): [number, number] => [point.lat, point.lng])
      : [];
    if (mechanic) points.push([mechanic.lat, mechanic.lng]);
    if (customer) points.push([customer.lat, customer.lng]);
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
    }
  }, [map, customer, mechanic, route]);
  return null;
}

// Read-only tracking map: the dark pin is the customer's address, the
// inverted pin is the mechanic's live position.
export function TrackingMap({ customer, mechanic, route }: TrackingMapProps) {
  const icons = useMemo(
    () => ({ destination: destinationIcon(), mechanic: mechanicIcon() }),
    [],
  );
  const path: [number, number][] = route?.length
    ? route.map((point): [number, number] => [point.lat, point.lng])
    : customer && mechanic
      ? [
          [mechanic.lat, mechanic.lng],
          [customer.lat, customer.lng],
        ]
      : [];
  const hasPath = route
    ? route.length > 1
    : customer !== null && mechanic !== null;
  const fallbackCenter = customer ?? mechanic ?? defaultMapCenter();
  const center: [number, number] =
    customer && mechanic
      ? [(customer.lat + mechanic.lat) / 2, (customer.lng + mechanic.lng) / 2]
      : [fallbackCenter.lat, fallbackCenter.lng];

  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-56 w-full sm:h-64"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds customer={customer} mechanic={mechanic} route={route} />
        {customer && (
          <Marker
            position={[customer.lat, customer.lng]}
            icon={icons.destination}
          />
        )}
        {mechanic && (
          <Marker
            position={[mechanic.lat, mechanic.lng]}
            icon={icons.mechanic}
          />
        )}
        {hasPath && (
          <Polyline
            positions={path}
            pathOptions={
              route
                ? { color: "#18181b", weight: 4 }
                : { color: "#71717a", dashArray: "6 8", weight: 2 }
            }
          />
        )}
      </MapContainer>
    </div>
  );
}
