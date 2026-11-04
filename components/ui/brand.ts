// Shared brand utility strings (AGENTS.md Section 6): orange #FB923C carries
// surfaces and selected fills with #111111 text; #111111 also carries headings
// and focus rings on the white surface. Every solid action button is blue, in
// both themes and on customer and staff screens.
// Plain Tailwind class strings so the scanner picks them up from this file.

const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

// The single primary call to action on a screen.
export const BRAND_PRIMARY_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] ${FOCUS} bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]`;

// Solid action inside a card (add to selection, confirm).
export const BRAND_SOLID_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] ${FOCUS} bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]`;

// Create actions (add to cart, claim, submit a new record): blue solid.
export const BRAND_CREATE_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] ${FOCUS} bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]`;

// Create actions in a catalog grid: blue outline.
export const BRAND_CREATE_OUTLINE = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#1D4ED8] bg-white px-4 py-2.5 text-sm font-semibold text-[#1D4ED8] transition-colors duration-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-[#60A5FA] dark:bg-zinc-950 dark:text-[#60A5FA] dark:hover:bg-blue-950/40 ${FOCUS}`;

// Delete actions (clear cart, remove, revoke): red solid.
export const BRAND_DELETE_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-red-400 dark:text-[#111111] dark:hover:bg-red-300 ${FOCUS}`;

// Delete actions beside other row actions: red outline.
export const BRAND_DELETE_OUTLINE = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-red-600 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-red-400 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/40 ${FOCUS}`;

// White bordered secondary button.
export const BRAND_OUTLINE_BUTTON = `flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-600 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors duration-200 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-400 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 ${FOCUS}`;

// Filter chips and segmented choices.
export const BRAND_CHIP_ACTIVE =
  "border-[#111111] bg-[#FB923C] text-[#111111] dark:border-[#FB923C] dark:bg-[#FB923C] dark:text-[#111111]";
export const BRAND_CHIP_IDLE =
  "border-zinc-500 bg-white text-zinc-800 hover:border-zinc-500 dark:border-zinc-500 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500";

// Selectable option cards (delivery method, payment, time slot).
export const BRAND_OPTION_ACTIVE =
  "border-[#111111] ring-1 ring-[#111111] dark:border-zinc-100 dark:ring-zinc-100";
export const BRAND_OPTION_IDLE =
  "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500";

// Typography.
export const BRAND_EYEBROW =
  "text-xs font-semibold tracking-[0.14em] text-[#111111] uppercase dark:text-zinc-400";
export const BRAND_SECTION_TITLE =
  "text-xl font-extrabold tracking-tight text-[#111111] sm:text-2xl dark:text-zinc-50";
export const BRAND_PRICE =
  "font-extrabold tracking-tight text-[#111111] dark:text-zinc-50";

// Receipt-style summary box: page surface with a border, dashed rule above the total.
export const BRAND_RECEIPT =
  "rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950";
export const BRAND_RECEIPT_TOTAL =
  "flex items-baseline justify-between gap-3 border-t border-dashed border-zinc-400 pt-3 dark:border-zinc-600";

// Orange feature surface (one per section at most).
export const BRAND_ORANGE_SURFACE = "rounded-lg bg-[#FB923C] text-[#111111]";
