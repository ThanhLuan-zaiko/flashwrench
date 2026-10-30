// Detects a page whose animation frames have stopped: an occluded window,
// a background tab or an embedded pane can pause requestAnimationFrame
// even while `visibilityState` still reports "visible". GSAP tweens then
// freeze mid-way (cards half faded, counters stuck at 0), so callers use
// this to jump their one-shot tweens to the final state instead.

export const STARVATION_WINDOW_MS = 1000;
export const STARVATION_MIN_FRAMES = 3;

export type FrameClock = {
  requestAnimationFrame: (cb: () => void) => number;
  cancelAnimationFrame: (id: number) => void;
  setTimeout: (cb: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
};

// Counts frames for one window; fewer than the minimum means starved.
// Returns a cleanup that stops counting without calling `onStarved`.
export function watchFrameStarvation(
  clock: FrameClock,
  onStarved: () => void,
  windowMs = STARVATION_WINDOW_MS,
  minFrames = STARVATION_MIN_FRAMES,
): () => void {
  let frames = 0;
  let frameId = 0;
  const tick = () => {
    frames += 1;
    frameId = clock.requestAnimationFrame(tick);
  };
  frameId = clock.requestAnimationFrame(tick);
  const timerId = clock.setTimeout(() => {
    clock.cancelAnimationFrame(frameId);
    if (frames < minFrames) onStarved();
  }, windowMs);
  return () => {
    clock.cancelAnimationFrame(frameId);
    clock.clearTimeout(timerId);
  };
}

// The browser window as a FrameClock (bound so the methods keep `this`).
export function windowFrameClock(): FrameClock {
  return {
    requestAnimationFrame: (cb) => window.requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
    setTimeout: (cb, ms) => window.setTimeout(cb, ms),
    clearTimeout: (id) => window.clearTimeout(id),
  };
}
