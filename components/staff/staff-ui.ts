// Shared class strings for the orange staff sidebar. The sidebar is a orange
// surface in both themes, so its controls use ink text, an ink active
// state and an ink focus ring.

export const STAFF_ON_ORANGE_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FB923C]";

// Group rows: a full-width row with an icon and label. The selected row is a
// ink pill with white text; the others are bare on the orange surface.
export const STAFF_NAV_ROW_BASE =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors duration-200 motion-safe:active:scale-[0.99]";
export const STAFF_NAV_ROW_IDLE = "text-[#111111] hover:bg-[#111111]/10";
export const STAFF_NAV_ROW_ACTIVE = "bg-[#111111] text-white";

// Section sub-links under the selected group. The current page gets a white
// fill and an ink outline, as the selected option chips do elsewhere.
export const STAFF_SUB_LINK_BASE =
  "flex min-h-10 w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-semibold text-[#111111] transition-colors duration-200 motion-safe:active:scale-[0.99]";
export const STAFF_SUB_LINK_IDLE = "border-transparent hover:bg-[#111111]/10";
export const STAFF_SUB_LINK_ACTIVE = "border-[#111111] bg-white font-bold";

// Labels fade and shrink on the collapsed desktop rail instead of snapping.
export function staffLabelClass(collapsed: boolean): string {
  const base =
    "min-w-0 truncate duration-200 motion-safe:transition-[opacity,width]";
  return collapsed
    ? `${base} md:w-0 md:flex-none md:overflow-hidden md:opacity-0`
    : base;
}

// The section tree opens and closes by animating its grid row height.
export function staffTreeClass(collapsed: boolean): string {
  const base =
    "grid grid-rows-[1fr] duration-200 motion-safe:transition-[grid-template-rows,opacity]";
  return collapsed ? `${base} md:grid-rows-[0fr] md:opacity-0` : base;
}

// Bare square icon button in the sidebar header.
export const STAFF_ICON_BUTTON = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#111111] transition-colors duration-200 hover:bg-[#111111]/10 ${STAFF_ON_ORANGE_FOCUS}`;

// Content-side icon and avatar in the sticky top bar. The icon is bare
// (no rounded tile), per the visual style rules.
export const STAFF_ICON_TILE =
  "flex h-11 w-11 shrink-0 items-center justify-center text-[#111111] dark:text-zinc-100";
export const STAFF_AVATAR =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-sm font-bold text-[#111111] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
