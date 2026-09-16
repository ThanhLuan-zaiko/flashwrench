"use client";

import { useLayoutEffect, useRef } from "react";
import {
  createReveal,
  prefersReducedMotion,
  REVEAL_SELECTOR,
  type RevealGsap,
} from "@/lib/motion/reveal-animation";

// Reveal bento cards with a single ScrollTrigger per section.
// Cards opt in via `data-reveal`. Static layout stays pure Tailwind;
// GSAP only tweens transform and opacity at runtime.
//
// GSAP is imported lazily so the animation runtime (~110KB unminified)
// stays out of the first paint: content renders instantly and the motion
// enhances on arrival. Reduced-motion users never download it.
export function useBentoReveal<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (root.querySelectorAll(REVEAL_SELECTOR).length === 0) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, triggerModule]) => {
        if (cancelled) return;
        const gsap = gsapModule.default as RevealGsap;
        const scrollTrigger =
          (triggerModule as { ScrollTrigger?: unknown }).ScrollTrigger ??
          (triggerModule as { default?: unknown }).default;
        const ctx = createReveal(root, gsap, scrollTrigger);
        if (ctx) cleanup = () => ctx.revert();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return rootRef;
}
