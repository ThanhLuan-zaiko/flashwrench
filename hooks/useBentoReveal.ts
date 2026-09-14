"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

// Reveal bento cards with a single ScrollTrigger per section.
// Cards opt in via `data-reveal`. Static layout stays pure Tailwind;
// GSAP only tweens transform and opacity at runtime.
export function useBentoReveal<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-reveal]");
    if (targets.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return rootRef;
}
