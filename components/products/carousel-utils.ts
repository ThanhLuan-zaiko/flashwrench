// Pure helpers for the looping product carousel. The scroll track holds the
// real slides (positions 0..n-1) plus one trailing clone of slide 0 at
// position n, so every advance moves the content right-to-left and the wrap
// back to the start is an invisible instant jump.

export const CAROUSEL_AUTOPLAY_MS = 4000;
export const CAROUSEL_SETTLE_MS = 120;

// Track position (in slide widths) for a scroll offset.
export function slidePosition(scrollLeft: number, width: number): number {
  if (!Number.isFinite(scrollLeft) || !Number.isFinite(width) || width <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(scrollLeft / width));
}

// Real slide index for a track position; the trailing clone maps to slide 0.
export function slideIndexAt(position: number, total: number): number {
  if (total <= 0) return 0;
  return ((position % total) + total) % total;
}

// True when the track rests on the trailing clone and must jump back to 0.
export function isCloneSlide(position: number, total: number): boolean {
  return total > 1 && position >= total;
}

// Autoplay always steps forward, never past the clone.
export function nextSlidePosition(position: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(position + 1, total);
}

// Slides rendered in the track: originals plus the trailing clone when looping.
export function withLoopClone<T>(items: T[]): T[] {
  const first = items[0];
  return items.length > 1 && first !== undefined ? [...items, first] : items;
}
