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

export type TrackPoint = { lat: number; lng: number };

type TrackingMapProps = {
  customer: TrackPoint | null;
  mechanic: TrackPoint;
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
function FitBounds({ customer, mechanic }: TrackingMapProps) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[mechanic.lat, mechanic.lng]];
    if (customer) points.push([customer.lat, customer.lng]);
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
  }, [map, customer, mechanic]);
  return null;
}

// Read-only tracking map: the dark pin is the customer's address, the
// inverted pin is the mechanic's live position.
export function TrackingMap({ customer, mechanic }: TrackingMapProps) {
  const icons = useMemo(
    () => ({ destination: destinationIcon(), mechanic: mechanicIcon() }),
    [],
  );
  const center: [number, number] = customer
    ? [(customer.lat + mechanic.lat) / 2, (customer.lng + mechanic.lng) / 2]
    : [mechanic.lat, mechanic.lng];

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
        <FitBounds customer={customer} mechanic={mechanic} />
        {customer && (
          <Marker
            position={[customer.lat, customer.lng]}
            icon={icons.destination}
          />
        )}
        <Marker position={[mechanic.lat, mechanic.lng]} icon={icons.mechanic} />
        {customer && (
          <Polyline
            positions={[
              [mechanic.lat, mechanic.lng],
              [customer.lat, customer.lng],
            ]}
            pathOptions={{ dashArray: "6 8", weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
