// Shared class strings for the checkout sections (reference design:
// bold navy section titles, bordered option cards with a navy selected
// outline).
export const CHECKOUT_SECTION_TITLE =
  "text-lg font-extrabold tracking-tight text-[#111111] dark:text-zinc-50";

export function checkoutOptionClasses(active: boolean): string {
  const base =
    "border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] disabled:opacity-60 motion-safe:active:scale-[0.99]";
  return active
    ? `${base} border-[#111111] bg-white text-zinc-900 ring-1 ring-[#111111] dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-100`
    : `${base} border-zinc-500 bg-white text-zinc-800 hover:border-zinc-400 dark:border-zinc-500 dark:bg-zinc-950 dark:text-zinc-200`;
}
