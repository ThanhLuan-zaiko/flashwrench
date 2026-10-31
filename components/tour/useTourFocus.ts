"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

// Window during which the card is kept on screen after a step starts (ms).
// The spotlight is measured again as the page settles, so one check can run
// before the card has moved to its final place.
const FOCUS_WINDOW_MS = 3000;

// After this long a target that still has no box is treated as hidden (for
// example a booking step that the phone wizard is not showing) and skipped.
const HIDDEN_AFTER_MS = 1200;

// NextStepJS scrolls to the spotlight with its own effect, which can stop
// short of the step's target or leave the card below the fold when a tall
// target is measured. After each step this brings the target into view, then
// brings the card on screen if any part of it is still off screen.
export function useTourFocus(
  cardRef: RefObject<HTMLElement | null>,
  selector: string | undefined,
  stepKey: string,
  onHidden?: () => void,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run for each step; the body reads the card ref and selector
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const behavior = (): ScrollBehavior =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
    const startedAt = Date.now();
    const timers: number[] = [];

    // Runs after the library's own scroll in the same commit, so this wins.
    timers.push(
      window.setTimeout(() => {
        const target = selector
          ? document.querySelector<HTMLElement>(selector)
          : null;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          target.scrollIntoView({ block: "center", behavior: behavior() });
        }
      }, 0),
    );

    const checkCard = () => {
      const rect = card.getBoundingClientRect();
      const offScreen =
        rect.top < 0 ||
        rect.bottom > window.innerHeight ||
        rect.left < 0 ||
        rect.right > window.innerWidth;
      if (offScreen) {
        card.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: behavior(),
        });
      }
    };

    timers.push(window.setTimeout(checkCard, 700));
    timers.push(window.setTimeout(checkCard, 1500));
    timers.push(
      window.setTimeout(() => {
        const target = selector
          ? document.querySelector<HTMLElement>(selector)
          : null;
        const box = target?.getBoundingClientRect();
        const hidden = !box || box.width === 0 || box.height === 0;
        if (hidden && onHidden) onHidden();
      }, HIDDEN_AFTER_MS),
    );

    // Re-check once scrolling goes quiet, but only inside the focus window so
    // a later manual scroll is never pulled back.
    const onScroll = () => {
      if (Date.now() - startedAt > FOCUS_WINDOW_MS) {
        window.removeEventListener("scroll", onScroll);
        return;
      }
      timers.push(window.setTimeout(checkCard, 400));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [stepKey]);
}
