"use client";

import type gsap from "gsap";
import { type RefObject, useLayoutEffect } from "react";
import {
  CHAPTER_GROUP_SELECTOR,
  CHAPTER_LINE_SELECTOR,
  CHAPTER_LINES,
  CHAPTER_PHOTO_CLIP,
  CHAPTER_PHOTO_END,
  CHAPTER_PHOTO_SELECTOR,
  CHAPTER_ROW,
  CHAPTER_ROW_SELECTOR,
  CHAPTER_RULE,
  CHAPTER_RULE_SELECTOR,
  CHAPTER_START,
} from "@/lib/motion/chapter-motion";
import {
  watchFrameStarvation,
  windowFrameClock,
} from "@/lib/motion/frame-starvation";
import {
  isPageHidden,
  prefersReducedMotion,
} from "@/lib/motion/reveal-animation";

type Tween = gsap.core.Tween;

// Scroll choreography for a home chapter section: headline lines rise out of
// their masks, hairline rules draw in, rows fade up and photos open as they
// scroll into view. Line, rule and row tweens run once; photo tweens scrub
// with the scroll position. `ready` delays setup for sections that render
// after async data. The GSAP runtime loads lazily and reduced-motion
// users get the final state with nothing downloaded.
export function useChapterMotion(
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
        const onceTweens: Tween[] = [];
        const ctx = gsapApi.context(() => {
          buildChapter(gsapApi, root, onceTweens);
        }, root);
        // Paused frames would freeze the one-shot tweens half way.
        const stopWatch = watchFrameStarvation(windowFrameClock(), () => {
          for (const tween of onceTweens) tween.progress(1);
        });
        const refresh = () => triggerModule.ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        cleanup = () => {
          window.removeEventListener("load", refresh);
          stopWatch();
          ctx.revert();
        };
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [rootRef, ready]);
}

function onceTrigger(trigger: Element) {
  return { trigger, start: CHAPTER_START, once: true };
}

function buildChapter(gsapApi: typeof gsap, root: HTMLElement, once: Tween[]) {
  for (const group of root.querySelectorAll<HTMLElement>(
    CHAPTER_GROUP_SELECTOR,
  )) {
    const lines = group.querySelectorAll(CHAPTER_LINE_SELECTOR);
    if (lines.length === 0) continue;
    once.push(
      gsapApi.fromTo(lines, CHAPTER_LINES.from, {
        ...CHAPTER_LINES.to,
        scrollTrigger: onceTrigger(group),
      }),
    );
  }
  for (const rule of root.querySelectorAll<HTMLElement>(
    CHAPTER_RULE_SELECTOR,
  )) {
    once.push(
      gsapApi.fromTo(rule, CHAPTER_RULE.from, {
        ...CHAPTER_RULE.to,
        scrollTrigger: onceTrigger(rule),
      }),
    );
  }
  for (const row of root.querySelectorAll<HTMLElement>(CHAPTER_ROW_SELECTOR)) {
    once.push(
      gsapApi.fromTo(row, CHAPTER_ROW.from, {
        ...CHAPTER_ROW.to,
        scrollTrigger: onceTrigger(row),
      }),
    );
  }
  for (const photo of root.querySelectorAll<HTMLElement>(
    CHAPTER_PHOTO_SELECTOR,
  )) {
    gsapApi.fromTo(photo, CHAPTER_PHOTO_CLIP.from, {
      ...CHAPTER_PHOTO_CLIP.to,
      ease: "none",
      scrollTrigger: {
        trigger: photo,
        start: CHAPTER_START,
        end: CHAPTER_PHOTO_END,
        scrub: true,
      },
    });
  }
}
