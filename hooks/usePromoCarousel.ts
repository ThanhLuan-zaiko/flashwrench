"use client";

import { type TouchEvent, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export type PromoDirection = 1 | -1;

// Wraps any integer onto 0..count-1 so prev on the first slide lands on
// the last one and next on the last lands on the first.
export function wrapIndex(next: number, count: number): number {
  if (count <= 0) return 0;
  return ((next % count) + count) % count;
}

// Slide state for the promotion spotlight: the active index, the travel
// direction (drives the GSAP slide-in side), autoplay that pauses on
// hover, focus, hidden tabs and reduced motion, and a horizontal swipe.
export function usePromoCarousel(count: number) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<PromoDirection>(1);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const safeIndex = wrapIndex(index, count);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const go = (next: number, dir?: PromoDirection) => {
    if (count === 0) return;
    const target = wrapIndex(next, count);
    if (target === safeIndex) return;
    setDirection(dir ?? (next > safeIndex ? 1 : -1));
    setIndex(target);
  };
  const next = () => go(safeIndex + 1, 1);
  const prev = () => go(safeIndex - 1, -1);

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setDirection(1);
      setIndex((current) => wrapIndex(current + 1, count));
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reducedMotion]);

  const swipeHandlers = {
    onTouchStart: (event: TouchEvent) => {
      touchStartX.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      const end = event.changedTouches[0]?.clientX;
      if (start === null || end === undefined) return;
      const delta = end - start;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (delta < 0) next();
      else prev();
    },
  };

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  return {
    index: safeIndex,
    direction,
    paused,
    go,
    next,
    prev,
    swipeHandlers,
    pauseHandlers,
  };
}
