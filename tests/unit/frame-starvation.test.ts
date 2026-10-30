// Paused animation frames must not freeze one-shot reveals: the watcher
// reports starvation when too few frames arrive in its window.
import { describe, expect, test } from "bun:test";
import {
  type FrameClock,
  watchFrameStarvation,
} from "@/lib/motion/frame-starvation";

function makeClock() {
  let nextId = 1;
  const frames = new Map<number, () => void>();
  const timers = new Map<number, () => void>();
  const clock: FrameClock = {
    requestAnimationFrame: (cb) => {
      const id = nextId++;
      frames.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => {
      frames.delete(id);
    },
    setTimeout: (cb) => {
      const id = nextId++;
      timers.set(id, cb);
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
  };
  return {
    clock,
    runFrames(count: number) {
      for (let i = 0; i < count; i++) {
        const pending = [...frames.entries()];
        frames.clear();
        for (const [, cb] of pending) cb();
      }
    },
    fireTimers() {
      const pending = [...timers.values()];
      timers.clear();
      for (const cb of pending) cb();
    },
    pendingFrames: () => frames.size,
    pendingTimers: () => timers.size,
  };
}

describe("watchFrameStarvation", () => {
  test("reports starvation when frames are paused", () => {
    const fake = makeClock();
    let starved = 0;
    watchFrameStarvation(fake.clock, () => {
      starved += 1;
    });
    fake.runFrames(1);
    fake.fireTimers();
    expect(starved).toBe(1);
    expect(fake.pendingFrames()).toBe(0);
  });

  test("stays quiet when frames keep coming", () => {
    const fake = makeClock();
    let starved = 0;
    watchFrameStarvation(fake.clock, () => {
      starved += 1;
    });
    fake.runFrames(10);
    fake.fireTimers();
    expect(starved).toBe(0);
    expect(fake.pendingFrames()).toBe(0);
  });

  test("cleanup cancels the frame loop and the timer", () => {
    const fake = makeClock();
    let starved = 0;
    const stop = watchFrameStarvation(fake.clock, () => {
      starved += 1;
    });
    stop();
    expect(fake.pendingFrames()).toBe(0);
    expect(fake.pendingTimers()).toBe(0);
    fake.fireTimers();
    expect(starved).toBe(0);
  });
});
