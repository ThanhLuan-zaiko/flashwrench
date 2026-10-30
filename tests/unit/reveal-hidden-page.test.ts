// Hidden tabs throttle frames so a GSAP reveal would crawl for many
// seconds: hidden pages skip the reveal or jump it to the final state.
import { describe, expect, test } from "bun:test";
import {
  createReveal,
  finishRevealOnHide,
  isPageHidden,
  type RevealContext,
  type RevealGsap,
} from "@/lib/motion/reveal-animation";

function makeGsap(progressCalls: number[]): RevealGsap {
  return {
    registerPlugin: () => undefined,
    context: (fn: () => void) => {
      fn();
      return { revert: () => undefined };
    },
    fromTo: () => ({
      progress: (value: number) => {
        progressCalls.push(value);
      },
    }),
  };
}

const root = {
  querySelectorAll: () => [1, 2],
} as unknown as Element;

function makeDoc(state: string) {
  const listeners = new Set<() => void>();
  return {
    visibilityState: state,
    addEventListener: (_type: "visibilitychange", fn: () => void) => {
      listeners.add(fn);
    },
    removeEventListener: (_type: "visibilitychange", fn: () => void) => {
      listeners.delete(fn);
    },
    fire() {
      for (const fn of listeners) fn();
    },
    listeners,
  };
}

describe("isPageHidden", () => {
  test("is true only for a hidden document", () => {
    expect(isPageHidden({ visibilityState: "hidden" })).toBe(true);
    expect(isPageHidden({ visibilityState: "visible" })).toBe(false);
    expect(isPageHidden(undefined)).toBe(false);
  });
});

describe("createReveal finish", () => {
  test("jumps the reveal tween to its end", () => {
    const calls: number[] = [];
    const ctx = createReveal(root, makeGsap(calls), {});
    ctx?.finish();
    expect(calls).toEqual([1]);
  });
});

describe("finishRevealOnHide", () => {
  test("finishes the reveal when the page becomes hidden", () => {
    const finished: string[] = [];
    const reveal: RevealContext = {
      revert: () => undefined,
      finish: () => finished.push("done"),
    };
    const doc = makeDoc("visible");
    finishRevealOnHide(doc, reveal);

    doc.fire();
    expect(finished).toEqual([]);

    doc.visibilityState = "hidden";
    doc.fire();
    expect(finished).toEqual(["done"]);
  });

  test("cleanup removes the listener", () => {
    const doc = makeDoc("hidden");
    const stop = finishRevealOnHide(doc, {
      revert: () => undefined,
      finish: () => undefined,
    });
    expect(doc.listeners.size).toBe(1);
    stop();
    expect(doc.listeners.size).toBe(0);
  });
});
