// Scroll helpers for the filter pill strip. Pure and SSR-safe so the
// option builder stays unit-testable without a DOM.
export type TabScrollOptions = {
  behavior: ScrollBehavior;
  block: ScrollLogicalPosition;
  inline: ScrollLogicalPosition;
};

// Reduced-motion users (and server renders) get an instant jump.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Center the active pill inside the strip without moving the page:
// block "nearest" never scrolls the viewport when the strip is visible.
export function tabScrollOptions(reducedMotion: boolean): TabScrollOptions {
  return {
    behavior: reducedMotion ? "auto" : "smooth",
    block: "nearest",
    inline: "center",
  };
}
