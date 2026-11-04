// Shared class strings for the black staff chrome. The sidebar is a black
// surface in both themes, so its controls use white-on-black states, a
// yellow active pill and a white focus ring.

export const STAFF_ON_NAVY_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]";

export const STAFF_NAV_LINK_ACTIVE = "bg-[#FACC15] text-[#111111]";
export const STAFF_NAV_LINK_IDLE =
  "text-zinc-200 hover:bg-white/10 hover:text-white";

// Two-part sidebar: square icon actions in the dark rail and stacked
// label + description links in the panel.
export const STAFF_RAIL_BUTTON = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white ${STAFF_ON_NAVY_FOCUS}`;
export const STAFF_NAV_PANEL_LINK = `block min-h-[44px] w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-200 motion-safe:active:scale-[0.99] ${STAFF_ON_NAVY_FOCUS}`;

// Content-side icon and avatar in the sticky top bar. The icon is bare
// (no rounded tile), per the visual style rules.
export const STAFF_ICON_TILE =
  "flex h-11 w-11 shrink-0 items-center justify-center text-[#111111] dark:text-zinc-100";
export const STAFF_AVATAR =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-sm font-bold text-[#111111] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
