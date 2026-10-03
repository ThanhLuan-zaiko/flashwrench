"use client";

import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

// One-shot number tween into a span's textContent — the bento stat tiles
// count up on first mount. GSAP loads lazily like useBentoReveal so the
// runtime stays out of first paint; reduced-motion and load failures get
// the final value instantly.
export function useCountUp(target: number, format: (value: number) => string) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || target === 0) {
      el.textContent = format(target);
      return;
    }
    let cancelled = false;
    const state = { value: 0 };
    void import("gsap")
      .then((gsapModule) => {
        if (cancelled) return;
        const gsap = gsapModule.default;
        gsap.to(state, {
          value: target,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = format(Math.round(state.value));
          },
        });
      })
      .catch(() => {
        el.textContent = format(target);
      });
    return () => {
      cancelled = true;
    };
  }, [target, format]);

  return ref;
}
