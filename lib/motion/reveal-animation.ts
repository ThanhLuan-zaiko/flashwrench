// Motion-only reveal for bento sections. Static layout stays pure Tailwind;
// GSAP only tweens transform and opacity at runtime.
// See frontend-bento-gsap.md for the allowed motion values.
//
// The real GSAP module is loaded lazily by hooks/useBentoReveal so the
// animation runtime stays out of the first paint. Everything here works
// against the narrow RevealGsap structural type, never the real module,
// which keeps this file dependency-free and unit testable.

export const REVEAL_SELECTOR = "[data-reveal]";

export const REVEAL_FROM_Y = 24;
export const REVEAL_DURATION = 0.6;
export const REVEAL_EASE = "power2.out";
export const REVEAL_STAGGER = 0.08;
export const REVEAL_TRIGGER_START = "top 85%";

export type RevealContext = {
  revert: () => void;
};

export type RevealGsap = {
  registerPlugin: (plugin: unknown) => void;
  context: (fn: () => void, scope: unknown) => RevealContext;
  fromTo: (
    targets: string,
    fromVars: { y: number; opacity: number },
    toVars: {
      y: number;
      opacity: number;
      duration: number;
      ease: string;
      stagger: number;
      scrollTrigger: { trigger: unknown; start: string; once: boolean };
    },
  ) => unknown;
};

// Reduced-motion users get the final state instantly, with no animation
// runtime downloaded at all. Missing matchMedia (SSR) means no opinion.
export function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Builds one ScrollTrigger per section and staggers every [data-reveal]
// card inside it. Returns null when the section has no reveal targets so
// the caller can skip the animation work entirely.
export function createReveal(
  root: Element,
  gsap: RevealGsap,
  scrollTrigger: unknown,
): RevealContext | null {
  if (root.querySelectorAll(REVEAL_SELECTOR).length === 0) return null;
  gsap.registerPlugin(scrollTrigger);
  return gsap.context(() => {
    gsap.fromTo(
      REVEAL_SELECTOR,
      { y: REVEAL_FROM_Y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: REVEAL_DURATION,
        ease: REVEAL_EASE,
        stagger: REVEAL_STAGGER,
        scrollTrigger: {
          trigger: root,
          start: REVEAL_TRIGGER_START,
          once: true,
        },
      },
    );
  }, root);
}
