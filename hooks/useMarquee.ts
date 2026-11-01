"use client";

import { type RefObject, useLayoutEffect } from "react";
import {
  type MarqueeDirection,
  marqueeDuration,
  marqueeOffsets,
} from "@/lib/motion/chapter-motion";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

// Endless loop for a track that holds two identical copies of its items side
// by side. One GSAP tween slides the track by the width of one copy, then
// repeats; the copies line up, so the loop has no jump. "left" moves content
// from right to left, "right" from left to right. Hovering the container pauses
// it. Skipped for reduced motion, and when one copy is already narrower than the
// container (the items then sit still).
export function useMarquee(
  containerRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  ready = true,
  direction: MarqueeDirection = "left",
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track || !ready) return;
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("gsap").then(({ default: gsapApi }) => {
      if (cancelled) return;
      const distance = track.scrollWidth / 2;
      if (distance <= container.clientWidth) return;
      const { from, to } = marqueeOffsets(direction, distance);
      const tween = gsapApi.fromTo(
        track,
        { x: from },
        {
          x: to,
          duration: marqueeDuration(distance),
          ease: "none",
          repeat: -1,
        },
      );
      const pause = () => tween.pause();
      const play = () => tween.play();
      container.addEventListener("pointerenter", pause);
      container.addEventListener("pointerleave", play);
      cleanup = () => {
        container.removeEventListener("pointerenter", pause);
        container.removeEventListener("pointerleave", play);
        tween.kill();
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [containerRef, trackRef, ready, direction]);
}
