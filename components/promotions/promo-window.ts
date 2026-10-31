// The expanding strip and the phone accordion show at most this many
// campaigns at once, so a long campaign list never squeezes panels into slivers.
export const PROMO_VISIBLE_LIMIT = 6;

// First campaign of the visible window: keeps the open campaign inside the
// window and centred where possible, clamped to the list's ends. The carousel
// still rotates through every campaign.
export function promoWindowStart(
  count: number,
  index: number,
  size = PROMO_VISIBLE_LIMIT,
): number {
  if (count <= size) return 0;
  const centred = index - Math.floor(size / 2);
  return Math.min(Math.max(centred, 0), count - size);
}
