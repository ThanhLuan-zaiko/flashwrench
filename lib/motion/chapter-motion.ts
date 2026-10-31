// Motion values for the home "chapter" sections (promotions, services and the
// closing call to action). Pure data only: hooks/useChapterMotion.ts turns
// them into GSAP tweens. See frontend-bento-gsap.md section 4.7.

export const CHAPTER_GROUP_SELECTOR = "[data-lines]";
export const CHAPTER_LINE_SELECTOR = "[data-line]";
export const CHAPTER_RULE_SELECTOR = "[data-rule]";
export const CHAPTER_ROW_SELECTOR = "[data-chapter-row]";
export const CHAPTER_PHOTO_SELECTOR = "[data-chapter-photo]";

export const CHAPTER_START = "top 88%";
export const CHAPTER_PHOTO_END = "top 55%";

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

// Photos open from top to bottom through an inset clip-path, scrubbed.
export const CHAPTER_PHOTO_CLIP: ChapterTween<
  { clipPath: string },
  { clipPath: string }
> = {
  from: { clipPath: "inset(0% 0% 100% 0%)" },
  to: { clipPath: "inset(0% 0% 0% 0%)" },
};

export const CHAPTER_PARALLAX_SELECTOR = "[data-parallax]";
export const CHAPTER_FOCUS_SELECTOR = "[data-focus]";
export const CHAPTER_COUNT_SELECTOR = "[data-count-to]";
export const CHAPTER_PREVIEW_SELECTOR = "[data-preview]";
export const CHAPTER_PREVIEW_SOURCE_SELECTOR = "[data-preview-src]";

// Focus dimming only runs from md up, where the dimmed title is large text.
export const CHAPTER_FOCUS_QUERY = "(min-width: 768px)";
// The cursor preview needs a real pointer and room beside the list.
export const CHAPTER_PREVIEW_QUERY = "(hover: hover) and (min-width: 1024px)";

// Photos sit inside a clipped frame, scaled up so a vertical drift never
// exposes the frame edge: 20% scale leaves 10% spare on each side.
export const CHAPTER_PARALLAX = {
  scale: 1.2,
  shiftPercent: 8,
} as const;

// Titles dim away from the viewport centre but stay readable as large text.
export const CHAPTER_FOCUS_MIN_OPACITY = 0.55;

export const CHAPTER_PREVIEW = {
  width: 320,
  height: 200,
  gap: 24,
  edge: 8,
  followDuration: 0.4,
  fadeDuration: 0.3,
  hiddenScale: 0.92,
} as const;

// Counters tween 0 to the value once, in the same format as the static text.
export function formatCountValue(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export type PreviewPosition = { x: number; y: number };

// Places the preview beside the pointer, flipping to the left near the right
// edge and clamping vertically so it never leaves the viewport.
export function previewPosition(
  pointerX: number,
  pointerY: number,
  viewportWidth: number,
  viewportHeight: number,
): PreviewPosition {
  const { width, height, gap, edge } = CHAPTER_PREVIEW;
  const fitsRight = pointerX + gap + width <= viewportWidth - edge;
  const x = fitsRight ? pointerX + gap : pointerX - gap - width;
  const maxY = viewportHeight - height - edge;
  const y = Math.min(Math.max(pointerY - height / 2, edge), maxY);
  return { x, y };
}
