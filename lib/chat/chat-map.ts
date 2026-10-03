// Static OpenStreetMap embed for a shared chat fix. Pure and client
// safe: the bubble renders an iframe, never a JS map, so long threads
// stay light and server rendering never touches window.
import type { ChatLocation } from "./chat-content";

const EMBED_DELTA = 0.008;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toBBox(point: ChatLocation): string {
  const south = clamp(point.lat - EMBED_DELTA, -90, 90);
  const north = clamp(point.lat + EMBED_DELTA, -90, 90);
  const west = clamp(point.lng - EMBED_DELTA, -180, 180);
  const east = clamp(point.lng + EMBED_DELTA, -180, 180);
  return `${west},${south},${east},${north}`;
}

// Embeddable OSM frame centred on the fix with a single marker.
export function chatLocationEmbedUrl(point: ChatLocation): string {
  const bbox = toBBox(point);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point.lat},${point.lng}`;
}
