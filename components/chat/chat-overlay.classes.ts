// Floating chat overlay geometry. The panel and its launcher must stack
// above the sticky site header (sticky top-0 z-50, inner bar h-16) so the
// panel header and close button are never hidden behind it. The panel height
// reserves the header (4rem) plus its bottom-24 anchor (6rem) and a 1rem gap,
// which keeps the whole sheet below the header on every viewport.
const CHAT_FLOAT_Z = "z-[60]";

export const CHAT_PANEL_CLASSES = `fixed bottom-24 right-4 ${CHAT_FLOAT_Z} flex h-[min(560px,calc(100dvh-11rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:right-5`;

// A docked bottom action bar (marked `data-dock-bar`) lifts the launcher
// above it so the bar's primary button is never covered. Bars marked
// `data-dock-bar="phone"` are hidden from lg up, so the lift stops there.
// Phones get a 48px launcher closer to the corner so it covers less of the
// row it floats over.
export const CHAT_FAB_CLASSES = `fixed bottom-4 right-4 sm:bottom-5 sm:right-5 [body:has([data-dock-bar])_&]:bottom-24 sm:[body:has([data-dock-bar])_&]:bottom-44 lg:[body:has([data-dock-bar=phone])_&]:bottom-5 ${CHAT_FLOAT_Z} flex h-12 w-12 items-center justify-center rounded-full bg-[#FACC15] sm:h-14 sm:w-14 text-[#111111] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:transition-transform dark:bg-zinc-100 dark:text-zinc-900`;
