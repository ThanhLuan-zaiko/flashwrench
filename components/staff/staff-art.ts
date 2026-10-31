// Decorative isometric drawings reused across the staff portals. Sizes are
// the intrinsic SVG dimensions next/image needs; display size comes from
// Tailwind classes at the call site.
export type StaffArt = { src: string; width: number; height: number };

const BASE = "/images/isometric";

export const STAFF_ART = {
  calendar: { src: `${BASE}/calendar.svg`, width: 60, height: 42 },
  package: { src: `${BASE}/package.svg`, width: 60, height: 53 },
  van: { src: `${BASE}/van.svg`, width: 62, height: 58 },
  towTruck: { src: `${BASE}/tow-truck.svg`, width: 68, height: 53 },
  coins: { src: `${BASE}/coins.svg`, width: 29, height: 42 },
  crates: { src: `${BASE}/crates.svg`, width: 60, height: 52 },
  toolbox: { src: `${BASE}/toolbox.svg`, width: 240, height: 240 },
  gift: { src: `${BASE}/gift.svg`, width: 66, height: 77 },
  idCard: { src: `${BASE}/id-card.svg`, width: 58, height: 40 },
  clipboard: { src: `${BASE}/clipboard.svg`, width: 35, height: 53 },
  gear: { src: `${BASE}/gear.svg`, width: 240, height: 240 },
} as const satisfies Record<string, StaffArt>;
