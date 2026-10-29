"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";
import type { PromoDirection } from "./usePromoCarousel";

type Gsap = typeof import("gsap").default;

const SLIDE_OFFSET_X = 24;
const TEXT_DURATION = 0.45;
const TEXT_STAGGER = 0.06;
const MEDIA_DURATION = 0.6;
const MEDIA_FROM_SCALE = 1.08;
const EASE = "power2.out";

// Slide-change motion for the promotion spotlight. The first render is
// left to the section's bento reveal; every later change slides the copy
// in from the travel side with a short stagger, settles the new cover
// from a slight zoom and fills the active progress segment. Opacity of
// the covers themselves stays a Tailwind cross-fade, so a GSAP failure
// (or reduced motion) still lands on the correct final frame.
export function usePromoSlideMotion<T extends HTMLElement>(
  index: number,
  direction: PromoDirection,
) {
  const rootRef = useRef<T>(null);
  const gsapRef = useRef<Gsap | null>(null);
  const shownIndex = useRef(index);

  // Load GSAP once up front so slide changes can animate synchronously in
  // the layout phase, before the new slide paints at its final state.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    void import("gsap")
      .then((module) => {
        if (!cancelled) gsapRef.current = module.default;
      })
      .catch(() => {
        gsapRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    // Same slide (first mount, or only the direction changed): no motion.
    if (shownIndex.current === index) return;
    shownIndex.current = index;
    const gsap = gsapRef.current;
    const root = rootRef.current;
    if (!gsap || !root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-promo-anim]",
        { opacity: 0, x: SLIDE_OFFSET_X * direction },
        {
          opacity: 1,
          x: 0,
          duration: TEXT_DURATION,
          ease: EASE,
          stagger: TEXT_STAGGER,
        },
      );
      gsap.fromTo(
        "[data-promo-cover='active']",
        { scale: MEDIA_FROM_SCALE },
        { scale: 1, duration: MEDIA_DURATION, ease: EASE },
      );
      gsap.fromTo(
        "[data-promo-segment='active']",
        { scaleX: 0 },
        { scaleX: 1, duration: MEDIA_DURATION, ease: EASE },
      );
    }, root);
    return () => ctx.revert();
  }, [index, direction]);

  return rootRef;
}
