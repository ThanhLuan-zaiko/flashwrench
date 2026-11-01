"use client";

import type gsap from "gsap";
import { type RefObject, useLayoutEffect, useState } from "react";
import { CHAPTER_CAROUSEL, nextSlideIndex } from "@/lib/motion/chapter-motion";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

// Photo carousel driven by GSAP. Slides are the `[data-slide]` children of
// `frameRef`; the active one fades in and the rest fade out with one tween per
// change. While `active`, a single repeating tween advances the index every
// CHAPTER_CAROUSEL.intervalSec. Reduced motion keeps manual changes but skips
// the timer and the fade. Returns the index and a setter for manual changes.
export function useCarousel(
  frameRef: RefObject<HTMLElement | null>,
  count: number,
  active: boolean,
): [number, (index: number) => void] {
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || count < 2 || !active) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let timer: gsap.core.Tween | undefined;
    void import("gsap").then(({ default: gsapApi }) => {
      if (cancelled) return;
      const advance = () => {
        timer = gsapApi.delayedCall(CHAPTER_CAROUSEL.intervalSec, () => {
          setIndex((current) => nextSlideIndex(current, count));
          advance();
        });
      };
      advance();
    });
    return () => {
      cancelled = true;
      timer?.kill();
    };
  }, [frameRef, count, active]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || count < 1) return;
    const slides = frame.querySelectorAll<HTMLElement>("[data-slide]");
    const duration = prefersReducedMotion() ? 0 : CHAPTER_CAROUSEL.fadeDuration;
    let cancelled = false;
    void import("gsap").then(({ default: gsapApi }) => {
      if (cancelled) return;
      gsapApi.to(slides, {
        opacity: (slideIndex: number) => (slideIndex === index ? 1 : 0),
        duration,
        ease: CHAPTER_CAROUSEL.ease,
        overwrite: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [frameRef, count, index]);

  return [index % Math.max(count, 1), setIndex];
}
