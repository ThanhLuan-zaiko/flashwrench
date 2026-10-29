// Shared brand utility strings for customer-facing screens (AGENTS.md
// Section 6): navy #1E3A5F carries headings, selected states and feature
// surfaces; orange #F97316 is reserved for the ONE primary action per
// screen, always with #0F1E33 text. Staff portals never import these.
// Plain Tailwind class strings so the scanner picks them up from this file.

const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

// The single primary call to action on a screen.
export const BRAND_PRIMARY_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] ${FOCUS}`;

// Filled navy action for secondary-but-solid buttons (add to selection,
// confirm inside a card) when an orange CTA already exists on the screen.
export const BRAND_SOLID_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0F1E33] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white ${FOCUS}`;

// White bordered secondary button.
export const BRAND_OUTLINE_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900 ${FOCUS}`;

// Filter chips and segmented choices.
export const BRAND_CHIP_ACTIVE =
  "border-[#1E3A5F] bg-[#1E3A5F] text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";
export const BRAND_CHIP_IDLE =
  "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500";

// Selectable option cards (delivery method, payment, time slot).
export const BRAND_OPTION_ACTIVE =
  "border-[#1E3A5F] ring-1 ring-[#1E3A5F] dark:border-zinc-100 dark:ring-zinc-100";
export const BRAND_OPTION_IDLE =
  "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500";

// Typography.
export const BRAND_EYEBROW =
  "text-xs font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400";
export const BRAND_SECTION_TITLE =
  "text-xl font-extrabold tracking-tight text-[#1E3A5F] sm:text-2xl dark:text-zinc-50";
export const BRAND_PRICE =
  "font-extrabold tracking-tight text-[#1E3A5F] dark:text-zinc-50";

// Receipt-style summary box: muted surface, dashed rule above the total.
export const BRAND_RECEIPT =
  "rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900";
export const BRAND_RECEIPT_TOTAL =
  "flex items-baseline justify-between gap-3 border-t border-dashed border-zinc-400 pt-3 dark:border-zinc-600";

// Navy feature surface (one per section at most).
export const BRAND_NAVY_SURFACE = "rounded-3xl bg-[#1E3A5F] text-white";
