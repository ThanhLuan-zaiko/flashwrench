"use client";

import { type RefObject, useEffect } from "react";
import {
  CHAPTER_PREVIEW,
  CHAPTER_PREVIEW_QUERY,
  CHAPTER_PREVIEW_SELECTOR,
  CHAPTER_PREVIEW_SOURCE_SELECTOR,
  previewPosition,
} from "@/lib/motion/chapter-motion";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";

const SCROLL_HIDE_PX = 24;

// Large photo that follows the mouse while it hovers a row carrying
// `data-preview-src`. The floating element (`data-preview`) is rendered by the
// section. Only mouse pointers on wide screens; touch and reduced-motion users
// keep the static photos. Movement uses gsap.quickTo on x and y.
export function useCursorPreview(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia(CHAPTER_PREVIEW_QUERY).matches) return;
    const preview = root.querySelector<HTMLElement>(CHAPTER_PREVIEW_SELECTOR);
    const image = preview?.querySelector("img");
    if (!preview || !image) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("gsap").then((gsapModule) => {
      if (cancelled) return;
      const gsapApi = gsapModule.default;
      const { followDuration, fadeDuration, hiddenScale } = CHAPTER_PREVIEW;
      gsapApi.set(preview, { opacity: 0, scale: hiddenScale });
      const moveX = gsapApi.quickTo(preview, "x", {
        duration: followDuration,
        ease: "power2.out",
      });
      const moveY = gsapApi.quickTo(preview, "y", {
        duration: followDuration,
        ease: "power2.out",
      });
      let visible = false;
      let shownAtScroll = 0;

      const hide = () => {
        if (!visible) return;
        visible = false;
        gsapApi.to(preview, {
          opacity: 0,
          scale: hiddenScale,
          duration: fadeDuration,
          ease: "power2.out",
        });
      };

      // Late layout shifts (lazy photos) fire scroll events too; only a real
      // scroll distance hides the preview.
      const onScroll = () => {
        if (Math.abs(window.scrollY - shownAtScroll) > SCROLL_HIDE_PX) hide();
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const row = (event.target as Element | null)?.closest<HTMLElement>(
          CHAPTER_PREVIEW_SOURCE_SELECTOR,
        );
        const source = row?.dataset.previewSrc;
        if (!source) {
          hide();
          return;
        }
        const next = previewPosition(
          event.clientX,
          event.clientY,
          window.innerWidth,
          window.innerHeight,
        );
        if (image.getAttribute("src") !== source) image.src = source;
        if (!visible) {
          visible = true;
          shownAtScroll = window.scrollY;
          gsapApi.set(preview, { x: next.x, y: next.y });
          gsapApi.to(preview, {
            opacity: 1,
            scale: 1,
            duration: fadeDuration,
            ease: "power2.out",
          });
          return;
        }
        moveX(next.x);
        moveY(next.y);
      };

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", hide);
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanup = () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", hide);
        window.removeEventListener("scroll", onScroll);
        gsapApi.killTweensOf(preview);
        gsapApi.set(preview, { opacity: 0 });
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [rootRef]);
}
