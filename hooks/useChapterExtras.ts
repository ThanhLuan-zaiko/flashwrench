"use client";

import type gsap from "gsap";
import { type RefObject, useLayoutEffect } from "react";
import {
  CHAPTER_COUNT_SELECTOR,
  CHAPTER_FOCUS_MIN_OPACITY,
  CHAPTER_FOCUS_QUERY,
  CHAPTER_FOCUS_SELECTOR,
  CHAPTER_PARALLAX,
  CHAPTER_PARALLAX_SELECTOR,
  CHAPTER_START,
  formatCountValue,
} from "@/lib/motion/chapter-motion";
import {
  isPageHidden,
  prefersReducedMotion,
} from "@/lib/motion/reveal-animation";

type Counter = { element: HTMLElement; target: number };

// Scroll-driven extras for chapter sections that opt in with data attributes:
// photo parallax (`data-parallax`), title focus dimming (`data-focus`, md and
// up) and price counters (`data-count-to`). Parallax and focus scrub with the
// scroll position; counters run once. Skipped entirely for reduced motion.
export function useChapterExtras(
  rootRef: RefObject<HTMLElement | null>,
  ready = true,
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return;
    if (prefersReducedMotion()) return;
    if (isPageHidden(document)) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, triggerModule]) => {
        if (cancelled) return;
        const gsapApi = gsapModule.default;
        gsapApi.registerPlugin(triggerModule.ScrollTrigger);
        const counters = collectCounters(root);
        const media = gsapApi.matchMedia();
        const ctx = gsapApi.context(() => {
          buildParallax(gsapApi, root);
          buildCounters(gsapApi, counters);
          media.add(CHAPTER_FOCUS_QUERY, () => buildFocus(gsapApi, root));
        }, root);
        // Lazy photos shift the layout after setup; recompute positions.
        const refresh = () => triggerModule.ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        triggerModule.ScrollTrigger.update();
        cleanup = () => {
          window.removeEventListener("load", refresh);
          media.revert();
          ctx.revert();
          // A reverted counter must show the real value again.
          for (const { element, target } of counters) {
            element.textContent = formatCountValue(target);
          }
        };
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [rootRef, ready]);
}

function collectCounters(root: HTMLElement): Counter[] {
  const counters: Counter[] = [];
  for (const element of root.querySelectorAll<HTMLElement>(
    CHAPTER_COUNT_SELECTOR,
  )) {
    const target = Number(element.dataset.countTo);
    if (Number.isFinite(target)) counters.push({ element, target });
  }
  return counters;
}

function buildParallax(gsapApi: typeof gsap, root: HTMLElement) {
  const { scale, shiftPercent } = CHAPTER_PARALLAX;
  for (const photo of root.querySelectorAll<HTMLElement>(
    CHAPTER_PARALLAX_SELECTOR,
  )) {
    gsapApi.fromTo(
      photo,
      { yPercent: -shiftPercent, scale },
      {
        yPercent: shiftPercent,
        scale,
        ease: "none",
        scrollTrigger: {
          trigger: photo.parentElement ?? photo,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  }
}

function buildFocus(gsapApi: typeof gsap, root: HTMLElement) {
  for (const title of root.querySelectorAll<HTMLElement>(
    CHAPTER_FOCUS_SELECTOR,
  )) {
    gsapApi
      .timeline({
        scrollTrigger: {
          trigger: title,
          start: "top 85%",
          end: "bottom 15%",
          scrub: true,
        },
      })
      .fromTo(
        title,
        { opacity: CHAPTER_FOCUS_MIN_OPACITY },
        { opacity: 1, ease: "none", duration: 1 },
      )
      .to(title, {
        opacity: CHAPTER_FOCUS_MIN_OPACITY,
        ease: "none",
        duration: 1,
      });
  }
}

function buildCounters(gsapApi: typeof gsap, counters: Counter[]) {
  for (const { element, target } of counters) {
    const state = { value: 0 };
    gsapApi.to(state, {
      value: target,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = formatCountValue(Math.round(state.value));
      },
      scrollTrigger: { trigger: element, start: CHAPTER_START, once: true },
    });
  }
}
