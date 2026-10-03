// Floating chat overlay geometry. The panel and its launcher must stack
// above the sticky site header (sticky top-0 z-50, inner bar h-16) so the
// panel header and close button are never hidden behind it. The panel height
// reserves the header (4rem) plus its bottom-24 anchor (6rem) and a 1rem gap,
// which keeps the whole sheet below the header on every viewport.
const CHAT_FLOAT_Z = "z-[60]";

export const CHAT_PANEL_CLASSES = `fixed bottom-24 right-4 ${CHAT_FLOAT_Z} flex h-[min(560px,calc(100dvh-11rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:right-5`;

export const CHAT_FAB_CLASSES = `fixed bottom-5 right-5 ${CHAT_FLOAT_Z} flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:transition-transform dark:bg-zinc-100 dark:text-zinc-900`;
