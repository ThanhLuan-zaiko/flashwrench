"use client";

import type { Tour } from "nextstepjs";
import { NextStep, NextStepProvider } from "nextstepjs";
import { type ReactNode, useEffect, useState } from "react";
import { TourCard } from "./TourCard";

type TourProviderProps = {
  steps: Tour[];
  children: ReactNode;
};

// Shared spotlight-tour boundary for every page guide. Reveal hooks keep
// running inside the page; this provider only adds the opt-in overlay.
export function TourProvider({ steps, children }: TourProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <NextStepProvider>
      <NextStep
        steps={steps}
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
