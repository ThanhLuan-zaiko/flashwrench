// Shared class strings for the navy staff chrome. The sidebar is a navy
// surface in both themes (like the site header), so its controls use
// white-on-navy states and a white focus ring.

export const STAFF_ON_NAVY_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F]";

export const STAFF_NAV_LINK_BASE = `flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-200 motion-safe:active:scale-[0.99] ${STAFF_ON_NAVY_FOCUS}`;

export const STAFF_NAV_LINK_ACTIVE = "bg-white text-[#1E3A5F]";
export const STAFF_NAV_LINK_IDLE =
  "text-zinc-100 hover:bg-white/10 hover:text-white";

export const STAFF_NAV_GHOST_BUTTON = `flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition-colors duration-200 hover:bg-white/10 hover:text-white motion-safe:active:scale-[0.99] ${STAFF_ON_NAVY_FOCUS}`;

export const STAFF_NAV_OUTLINE_BUTTON = `flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10 motion-safe:active:scale-[0.99] ${STAFF_ON_NAVY_FOCUS}`;

// Content-side icon tile and avatar in the sticky top bar.
export const STAFF_ICON_TILE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1E3A5F] text-white dark:bg-zinc-100 dark:text-zinc-900";
export const STAFF_AVATAR =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#1E3A5F]/20 bg-[#1E3A5F]/10 text-sm font-bold text-[#1E3A5F] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
