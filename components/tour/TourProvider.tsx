"use client";

import type { Tour } from "nextstepjs";
import { NextStep, NextStepProvider } from "nextstepjs";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { TourCard } from "./TourCard";
import { adaptTours, type GuideTour } from "./tour-adapt";

type TourProviderProps = {
  steps: readonly (Tour | GuideTour)[];
  children: ReactNode;
};

// Shared spotlight-tour boundary for every page guide. Reveal hooks keep
// running inside the page; this provider only adds the opt-in overlay.
export function TourProvider({ steps, children }: TourProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // NextStepJS measures the spotlight once per step and again only on window
  // resize. Scrolling (its own smooth scroll, or the customer's) leaves the
  // spotlight and card at stale positions, so re-dispatch resize on each
  // animation frame of scrolling to keep them attached to the target.
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motion.matches);
    const onMotion = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    motion.addEventListener("change", onMotion);
    return () => motion.removeEventListener("change", onMotion);
  }, []);

  const tours = useMemo(() => adaptTours(steps), [steps]);

  return (
    <NextStepProvider>
      <NextStep
        steps={tours}
        cardComponent={TourCard}
        shadowRgb="0, 0, 0"
        shadowOpacity="0.2"
        cardTransition={
          reducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }
        }
        displayArrow
        clickThroughOverlay={false}
        scrollToTop={false}
        disableConsoleLogs
        overlayZIndex={999}
      >
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
