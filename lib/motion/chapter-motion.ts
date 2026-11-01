// Motion values for the home "chapter" sections (promotions, services and the
// closing call to action). Pure data only: hooks/useChapterMotion.ts turns
// them into GSAP tweens. See frontend-bento-gsap.md section 4.7.

export const CHAPTER_GROUP_SELECTOR = "[data-lines]";
export const CHAPTER_LINE_SELECTOR = "[data-line]";
export const CHAPTER_RULE_SELECTOR = "[data-rule]";
export const CHAPTER_ROW_SELECTOR = "[data-chapter-row]";
export const CHAPTER_PHOTO_SELECTOR = "[data-chapter-photo]";

export const CHAPTER_START = "top 88%";

const CHAPTER_DURATION = 0.6;
const CHAPTER_EASE = "power2.out";

export type ChapterTween<F extends object, T extends object> = {
  from: F;
  to: T;
};

// Headline lines rise out of an overflow-hidden mask, one after the other.
export const CHAPTER_LINES: ChapterTween<
  { yPercent: number },
  { yPercent: number; duration: number; ease: string; stagger: number }
> = {
  from: { yPercent: 110 },
  to: {
    yPercent: 0,
    duration: CHAPTER_DURATION,
    ease: CHAPTER_EASE,
    stagger: 0.08,
  },
};

// Hairline rules draw from the left edge.
export const CHAPTER_RULE: ChapterTween<
  { scaleX: number },
  { scaleX: number; duration: number; ease: string }
> = {
  from: { scaleX: 0 },
  to: { scaleX: 1, duration: CHAPTER_DURATION, ease: CHAPTER_EASE },
};

// Row content fades up a short distance once its rule has started drawing.
export const CHAPTER_ROW: ChapterTween<
  { y: number; opacity: number },
  { y: number; opacity: number; duration: number; ease: string }
> = {
  from: { y: 16, opacity: 0 },
  to: { y: 0, opacity: 1, duration: CHAPTER_DURATION, ease: CHAPTER_EASE },
};

// Photos open from top to bottom through an inset clip-path, once. A scrubbed
// reveal would stick half-open whenever the photo stops mid-range on screen.
export const CHAPTER_PHOTO_CLIP: ChapterTween<
  { clipPath: string },
  { clipPath: string; duration: number; ease: string }
> = {
  from: { clipPath: "inset(0% 0% 100% 0%)" },
  to: {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: CHAPTER_DURATION,
    ease: CHAPTER_EASE,
  },
};

export const CHAPTER_PARALLAX_SELECTOR = "[data-parallax]";
export const CHAPTER_COUNT_SELECTOR = "[data-count-to]";

// Photos sit inside a clipped frame, scaled up so a vertical drift never
// exposes the frame edge: 20% scale leaves 10% spare on each side.
export const CHAPTER_PARALLAX = {
  scale: 1.2,
  shiftPercent: 8,
} as const;

// Photo carousels advance on their own every `intervalSec` and crossfade over
// `fadeDuration`. Reduced motion skips both (see hooks/useCarousel.ts).
export const CHAPTER_CAROUSEL = {
  intervalSec: 5,
  fadeDuration: 0.6,
  ease: "power2.inOut",
} as const;

// Index of the next slide, wrapping back to the first after the last.
export function nextSlideIndex(current: number, count: number): number {
  if (count <= 0) return 0;
  return (current + 1) % count;
}

// Counters tween 0 to the value once, in the same format as the static text.
export function formatCountValue(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export const CHAPTER_RIBBON_SELECTOR = "[data-ribbon-item]";

// Ribbon cards start as a flat row and wind into depth as the row crosses
// the viewport (scrubbed). Each card's phase is its share of one full turn,
// so neighbours alternate between lifted and lowered, near and far.
export const CHAPTER_RIBBON = {
  lift: 24,
  depth: 120,
  tilt: 28,
} as const;

export type RibbonPose = { y: number; z: number; rotateY: number };

// Target pose for one card of a ribbon of `count` cards. Pure, so the GSAP
// hook only maps the result onto transform properties.
export function ribbonPose(index: number, count: number): RibbonPose {
  const phase = (index / Math.max(count, 1)) * Math.PI * 2;
  const { lift, depth, tilt } = CHAPTER_RIBBON;
  return {
    y: Math.sin(phase) * lift,
    z: Math.cos(phase) * depth,
    rotateY: -Math.cos(phase) * tilt,
  };
}

// Marquee rows (mechanics, reviews) slide one copy of their items to the left
// at a constant speed, so the loop reads as one steady drift.
export const CHAPTER_MARQUEE = {
  pxPerSecond: 60,
} as const;

// Seconds for one loop that moves `distance` px at the marquee speed.
export function marqueeDuration(distance: number): number {
  return distance / CHAPTER_MARQUEE.pxPerSecond;
}

export type MarqueeDirection = "left" | "right";

// Track offsets (px) for one loop: a "left" marquee slides from 0 to -distance
// (content moves right to left), a "right" marquee slides the other way.
export function marqueeOffsets(
  direction: MarqueeDirection,
  distance: number,
): { from: number; to: number } {
  return direction === "left"
    ? { from: 0, to: -distance }
    : { from: -distance, to: 0 };
}
