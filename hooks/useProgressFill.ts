"use client";

import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

// One-shot progress fill: the bar is a full-width div whose scaleX is
// driven at runtime (width changes are off-limits per the motion rules).
// The resting state is set by JS, never by a class, so a GSAP failure
// still lands on the correct final fill.
export function useProgressFill(ratio: number) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    if (prefersReducedMotion()) {
      el.style.transform = `scaleX(${clamped})`;
      return;
    }
    let cancelled = false;
    void import("gsap")
      .then((gsapModule) => {
        if (cancelled) return;
        const gsap = gsapModule.default;
        gsap.fromTo(
          el,
          { scaleX: 0 },
          { scaleX: clamped, duration: 0.6, ease: "power2.out" },
        );
      })
      .catch(() => {
        el.style.transform = `scaleX(${clamped})`;
      });
    return () => {
      cancelled = true;
    };
  }, [ratio]);

  return ref;
}
