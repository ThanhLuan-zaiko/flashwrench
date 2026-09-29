"use client";

import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";
import {
  CAROUSEL_AUTOPLAY_MS,
  CAROUSEL_SETTLE_MS,
  isCloneSlide,
  nextSlidePosition,
  slideIndexAt,
  slidePosition,
} from "./carousel-utils";

// Scroll-snap carousel controller for a track that ends with a clone of the
// first slide. Autoplay advances one slide every few seconds, always moving
// right-to-left, and the clone jumps back to slide 0 without a visible cut.
// Autoplay pauses while the mouse hovers, keyboard focus is inside, the tab
// is hidden, or the user touched the carousel recently; reduced-motion users
// never get autoplay.
export function useLoopingCarousel(total: number) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const settleTimer = useRef<number | null>(null);
  const hovering = useRef(false);
  const touchedAt = useRef(0);
  const [index, setIndex] = useState(0);
  const looping = total > 1;

  const currentPosition = useCallback(() => {
    const track = trackRef.current;
    return track ? slidePosition(track.scrollLeft, track.clientWidth) : 0;
  }, []);

  // `auto` defers to the CSS scroll-behavior on the track (smooth only under
  // motion-safe); `instant` is used for the invisible clone reset.
  const scrollToPosition = useCallback((position: number, instant = false) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: position * track.clientWidth,
      behavior: instant ? "instant" : "auto",
    });
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current !== null)
        window.clearTimeout(settleTimer.current);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !looping || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      if (document.hidden || hovering.current) return;
      if (root.querySelector(":focus-visible")) return;
      if (Date.now() - touchedAt.current < CAROUSEL_AUTOPLAY_MS) return;
      scrollToPosition(nextSlidePosition(currentPosition(), total));
    }, CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [looping, total, currentPosition, scrollToPosition]);

  const onScroll = useCallback(() => {
    setIndex(slideIndexAt(currentPosition(), total));
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      settleTimer.current = null;
      if (isCloneSlide(currentPosition(), total)) scrollToPosition(0, true);
    }, CAROUSEL_SETTLE_MS);
  }, [currentPosition, scrollToPosition, total]);

  const goTo = useCallback(
    (target: number) => {
      touchedAt.current = Date.now();
      scrollToPosition(Math.max(0, Math.min(total - 1, target)));
    },
    [scrollToPosition, total],
  );

  const next = useCallback(() => {
    touchedAt.current = Date.now();
    scrollToPosition(nextSlidePosition(currentPosition(), total));
  }, [currentPosition, scrollToPosition, total]);

  // From slide 0 the clone (visually identical) is entered instantly so the
  // step back still slides left-to-right instead of rewinding the whole track.
  const prev = useCallback(() => {
    touchedAt.current = Date.now();
    const position = currentPosition();
    if (position <= 0) scrollToPosition(total, true);
    scrollToPosition(position <= 0 ? total - 1 : position - 1);
  }, [currentPosition, scrollToPosition, total]);

  const interactionProps = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering.current = true;
    },
    onPointerLeave: () => {
      hovering.current = false;
    },
    onPointerDown: () => {
      touchedAt.current = Date.now();
    },
  };

  return {
    rootRef,
    trackRef,
    index: Math.min(index, Math.max(total - 1, 0)),
    onScroll,
    goTo,
    next,
    prev,
    interactionProps,
  };
}
