// Minimum items in one copy of a marquee, so a short list (one or two
// mechanics) still fills a wide screen and the loop never shows an empty gap.
export const MARQUEE_MIN_ITEMS = 6;

// Below this many distinct items a drifting row only shows the same few
// cards over and over, so chapters list them as static ruled rows instead.
export const MARQUEE_DRIFT_MIN = 4;

export function shouldDrift(count: number, min = MARQUEE_DRIFT_MIN): boolean {
  return count >= min;
}

export type MarqueeEntry<T> = { key: string; item: T };

// One copy of the marquee: the items repeated until there are at least
// MARQUEE_MIN_ITEMS entries. Each entry gets a key unique within the copy.
export function marqueeRow<T extends { id: string }>(
  items: T[],
  minItems = MARQUEE_MIN_ITEMS,
): MarqueeEntry<T>[] {
  if (items.length === 0) return [];
  const repeats = Math.max(1, Math.ceil(minItems / items.length));
  const entries: MarqueeEntry<T>[] = [];
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    for (const item of items) {
      entries.push({ key: `${repeat}-${item.id}`, item });
    }
  }
  return entries;
}
