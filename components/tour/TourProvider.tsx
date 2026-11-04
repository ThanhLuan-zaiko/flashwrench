"use client";

import type { Tour } from "nextstepjs";
import { NextStep, NextStepProvider } from "nextstepjs";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { TourCard } from "./TourCard";
import { TourScrollSync } from "./TourScrollSync";
import { adaptTours, type GuideTour } from "./tour-adapt";

type TourProviderProps = {
  steps: readonly (Tour | GuideTour)[];
  children: ReactNode;
};

// Shared spotlight-tour boundary for every page guide. Reveal hooks keep
// running inside the page; this provider only adds the opt-in overlay.
export function TourProvider({ steps, children }: TourProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

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
        <TourScrollSync />
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
