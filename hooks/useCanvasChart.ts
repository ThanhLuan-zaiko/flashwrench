"use client";

import { type DependencyList, useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

export type ChartDraw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
) => void;

// Canvas chart engine per frontend-bento-gsap.md 4.6: draws via a progress
// object tweened with GSAP, re-draws on each onUpdate tick, scales for
// devicePixelRatio, re-renders on resize and `dark` class flips, and hands
// reduced-motion users the final frame instantly. GSAP is lazy-imported so
// the runtime only ships when motion actually runs.
export function useCanvasChart(draw: ChartDraw, deps: DependencyList) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const render = (progress: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      drawRef.current(ctx, rect.width, rect.height, progress);
    };

    const resizeObserver = new ResizeObserver(() => render(1));
    resizeObserver.observe(canvas);
    // Re-resolve theme-aware colors when the `dark` class toggles.
    const themeObserver = new MutationObserver(() => render(1));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    if (prefersReducedMotion()) {
      render(1);
    } else {
      render(0);
      void import("gsap")
        .then((module) => {
          if (cancelled) return;
          const gsap = module.default;
          const context = gsap.context(() => {
            const state = { progress: 0 };
            gsap.to(state, {
              progress: 1,
              duration: 0.6,
              ease: "power2.out",
              onUpdate: () => render(state.progress),
            });
          }, canvas);
          cleanup = () => context.revert();
        })
        .catch(() => render(1));
    }

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      themeObserver.disconnect();
      cleanup?.();
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: callers pass the data signature that should re-run the draw
  }, deps);

  return canvasRef;
}
