import type { MouseEvent } from "react";

// Pager links navigate with scroll disabled so the page keeps its place. A
// pager sits at the foot of its list, so the next page would open near the
// footer. Moving to the top of the list first keeps the new page in view.
const HEADER_OFFSET_PX = 96;

export function scrollToPageTop(event: MouseEvent<HTMLAnchorElement>): void {
  const list = event.currentTarget.closest("nav, [data-pager]")?.parentElement;
  if (!list) return;
  const top = list.getBoundingClientRect().top + window.scrollY;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({
    top: Math.max(0, top - HEADER_OFFSET_PX),
    behavior: reduceMotion ? "auto" : "smooth",
  });
}
