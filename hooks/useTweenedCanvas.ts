"use client";

import { useLayoutEffect, useRef } from "react";
import { lerpSeries, seriesSignature } from "@/components/charts/chart-math";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

export type TweenedDraw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: number[],
  reveal: number,
) => void;

type GsapModule = typeof import("gsap");

const DURATION = 0.6;
const EASE = "power2.out";

// Canvas + GSAP engine for live charts (frontend-bento-gsap.md 4.6). The
// first draw reveals 0 → 1; every later data change tweens the drawn
// numbers from the previous values to the new ones, so a realtime refetch
// morphs the chart instead of replaying it from zero. Handles DPR, resize,
// `dark` class flips and reduced motion (final frame, no tween).
export function useTweenedCanvas(values: readonly number[], draw: TweenedDraw) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const shown = useRef<{ values: number[]; reveal: number }>({
    values: [...values],
    reveal: 0,
  });
  const gsapRef = useRef<GsapModule["default"] | null>(null);
  const signature = seriesSignature(values);

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
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
    const state = shown.current;
    drawRef.current(ctx, rect.width, rect.height, state.values, state.reveal);
  };
  const renderRef = useRef(render);
  renderRef.current = render;

  // Mount-once: observers plus the first reveal.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => renderRef.current();
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(redraw);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let cancelled = false;
    let revert: (() => void) | undefined;
    if (prefersReducedMotion()) {
      shown.current.reveal = 1;
      redraw();
    } else {
      redraw();
      void import("gsap")
        .then((module) => {
          if (cancelled) return;
          const gsap = module.default;
          gsapRef.current = gsap;
          const context = gsap.context(() => {
            gsap.to(shown.current, {
              reveal: 1,
              duration: DURATION,
              ease: EASE,
              onUpdate: redraw,
            });
          }, canvas);
          revert = () => context.revert();
        })
        .catch(() => {
          shown.current.reveal = 1;
          redraw();
        });
    }
    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      themeObserver.disconnect();
      revert?.();
    };
  }, []);

  // Data changes: morph from what is on screen to the new values.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the signature captures every value change
  useLayoutEffect(() => {
    const target = [...values];
    const from = [...shown.current.values];
    const gsap = gsapRef.current;
    if (!gsap || prefersReducedMotion()) {
      shown.current.values = target;
      renderRef.current();
      return;
    }
    const progress = { t: 0 };
    const tween = gsap.to(progress, {
      t: 1,
      duration: DURATION,
      ease: EASE,
      onUpdate: () => {
        shown.current.values = lerpSeries(from, target, progress.t);
        renderRef.current();
      },
    });
    return () => {
      tween.kill();
    };
  }, [signature]);

  return canvasRef;
}
