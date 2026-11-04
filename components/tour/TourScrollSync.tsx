"use client";

import { useNextStep } from "nextstepjs";
import { useEffect } from "react";

// NextStepJS measures the spotlight once per step and again only on window
// resize, so scrolling leaves the spotlight and card at stale positions. While
// a tour is open, re-dispatch resize on each frame of scrolling to keep them on
// the target. Only while a tour is open: ScrollTrigger also treats this event
// as a resize, and its refresh writes the scroll position, which fires scroll
// again. Left on, that loop never settles and cancels smooth scrolling.
export function TourScrollSync() {
  const { isNextStepVisible } = useNextStep();

  useEffect(() => {
    if (!isNextStepVisible) return;
    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() =>
        window.dispatchEvent(new Event("resize")),
      );
    };
    window.addEventListener("scroll", refresh, { passive: true });
    return () => {
      window.removeEventListener("scroll", refresh);
      window.cancelAnimationFrame(frame);
    };
  }, [isNextStepVisible]);

  return null;
}
