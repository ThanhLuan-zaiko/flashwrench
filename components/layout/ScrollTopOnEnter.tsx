"use client";

import { useLayoutEffect } from "react";

// Back and Forward restore the position the browser remembered, so they must
// not be reset. A click starts a fresh navigation and clears the mark.
let historyNavigation = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    historyNavigation = true;
  });
  window.addEventListener(
    "click",
    () => {
      historyNavigation = false;
    },
    { capture: true },
  );
}

// Rendered by layouts that mount a screen once and keep metadata-only leaves.
// Next.js scrolls a navigation to the DOM of the leaf page; a leaf returning
// null has none, so entering such a screen keeps the previous scrollY, which
// lands at the foot of the page when coming from a footer link or a long list.
// Tab and pager links inside the layout never remount it, so they keep their
// place.
export function ScrollTopOnEnter() {
  useLayoutEffect(() => {
    if (historyNavigation || window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  return null;
}
