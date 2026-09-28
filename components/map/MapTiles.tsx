"use client";

import { useSyncExternalStore } from "react";
import { TileLayer } from "react-leaflet";
import {
  TILE_ATTRIBUTION,
  TILE_SUBDOMAINS,
  tileUrlForTheme,
} from "./map-tiles";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function isDarkClass(): boolean {
  return document.documentElement.classList.contains("dark");
}

// Theme-aware tile layer: keying on the resolved URL remounts the layer
// only when the tile endpoint actually changes, never on a no-op flip.
export function MapTiles() {
  const dark = useSyncExternalStore(subscribe, isDarkClass, () => false);
  const url = tileUrlForTheme(dark);
  return (
    <TileLayer
      key={url}
      attribution={TILE_ATTRIBUTION}
      url={url}
      subdomains={TILE_SUBDOMAINS}
    />
  );
}
