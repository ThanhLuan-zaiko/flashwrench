"use client";

import { useLayoutEffect, useRef } from "react";
import {
  watchFrameStarvation,
  windowFrameClock,
} from "@/lib/motion/frame-starvation";
import {
  isPageHidden,
  prefersReducedMotion,
} from "@/lib/motion/reveal-animation";

// One-shot number tween into a span's textContent — the bento stat tiles
// count up on first mount. GSAP loads lazily like useBentoReveal so the
// runtime stays out of first paint; reduced-motion and load failures get
// the final value instantly.
export function useCountUp(target: number, format: (value: number) => string) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Hidden tabs throttle frames, so they get the final value at once.
    if (prefersReducedMotion() || isPageHidden(document) || target === 0) {
      el.textContent = format(target);
      return;
    }
    let cancelled = false;
    let stopFrameWatch: (() => void) | undefined;
    const state = { value: 0 };
    void import("gsap")
      .then((gsapModule) => {
        if (cancelled) return;
        const gsap = gsapModule.default;
        const tween = gsap.to(state, {
          value: target,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = format(Math.round(state.value));
          },
        });
        // Paused frames would leave the counter stuck near 0.
        stopFrameWatch = watchFrameStarvation(windowFrameClock(), () => {
          tween.progress(1);
          el.textContent = format(target);
        });
      })
      .catch(() => {
        el.textContent = format(target);
      });
    return () => {
      cancelled = true;
      stopFrameWatch?.();
    };
  }, [target, format]);

  return ref;
}
