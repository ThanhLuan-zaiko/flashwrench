import { describe, expect, test } from "bun:test";
import {
  createReveal,
  prefersReducedMotion,
  REVEAL_SELECTOR,
  type RevealGsap,
} from "@/lib/motion/reveal-animation";

type CallLog = {
  registered: unknown[];
  scopes: unknown[];
  fromTo: Array<{ targets: string; fromVars: unknown; toVars: unknown }>;
  reverts: number;
};

function makeGsap(): { gsap: RevealGsap; log: CallLog } {
  const log: CallLog = { registered: [], scopes: [], fromTo: [], reverts: 0 };
  const gsap: RevealGsap = {
    registerPlugin: (plugin: unknown) => {
      log.registered.push(plugin);
    },
    context: (fn: () => void, scope: unknown) => {
      log.scopes.push(scope);
      fn();
      return {
        revert: () => {
          log.reverts += 1;
        },
      };
    },
    fromTo: (targets: string, fromVars: unknown, toVars: unknown) => {
      log.fromTo.push({ targets, fromVars, toVars });
      return undefined;
    },
  };
  return { gsap, log };
}

function makeRoot(targetCount: number): {
  root: Element;
  seenSelectors: string[];
} {
  const seenSelectors: string[] = [];
  const root = {
    querySelectorAll: (selector: string) => {
      seenSelectors.push(selector);
      return Array.from({ length: targetCount }, (_, index) => index);
    },
  } as unknown as Element;
  return { root, seenSelectors };
}

function setMatchMedia(matches: boolean): void {
  const holder = globalThis as Record<string, unknown>;
  holder.window = {
    matchMedia: (_query: string) => ({ matches }),
  };
}

describe("prefersReducedMotion", () => {
  test("returns false when the user has no motion preference", () => {
    setMatchMedia(false);
    try {
      expect(prefersReducedMotion()).toBe(false);
    } finally {
      delete (globalThis as Record<string, unknown>).window;
    }
  });

  test("returns true when the user prefers reduced motion", () => {
    setMatchMedia(true);
    try {
      expect(prefersReducedMotion()).toBe(true);
    } finally {
      delete (globalThis as Record<string, unknown>).window;
    }
  });

  test("returns false without a window (server render)", () => {
    const holder = globalThis as Record<string, unknown>;
    const saved = holder.window;
    delete holder.window;
    try {
      expect(prefersReducedMotion()).toBe(false);
    } finally {
      if (saved !== undefined) holder.window = saved;
    }
  });
});

describe("createReveal", () => {
  test("returns null and touches GSAP never without targets", () => {
    const { gsap, log } = makeGsap();
    const { root, seenSelectors } = makeRoot(0);
    const plugin = { name: "ScrollTrigger" };

    expect(createReveal(root, gsap, plugin)).toBeNull();
    expect(seenSelectors).toEqual([REVEAL_SELECTOR]);
    expect(log.registered).toEqual([]);
    expect(log.fromTo).toEqual([]);
  });

  test("registers the trigger and staggers every card in one context", () => {
    const { gsap, log } = makeGsap();
    const { root } = makeRoot(4);
    const plugin = { name: "ScrollTrigger" };

    const ctx = createReveal(root, gsap, plugin);

    expect(ctx).not.toBeNull();
    expect(log.registered).toEqual([plugin]);
    expect(log.scopes).toEqual([root]);
    expect(log.fromTo.length).toBe(1);
    expect(log.fromTo[0]?.targets).toBe(REVEAL_SELECTOR);
    expect(log.fromTo[0]?.fromVars).toEqual({ y: 24, opacity: 0 });
    expect(log.fromTo[0]?.toVars).toEqual({
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.08,
      scrollTrigger: { trigger: root, start: "top 85%", once: true },
    });
  });

  test("returned cleanup reverts the GSAP context", () => {
    const { gsap, log } = makeGsap();
    const { root } = makeRoot(2);

    const ctx = createReveal(root, gsap, { name: "ScrollTrigger" });
    expect(ctx).not.toBeNull();
    ctx?.revert();
    expect(log.reverts).toBe(1);
  });
});
