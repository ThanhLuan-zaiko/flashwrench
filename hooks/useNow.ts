"use client";

import { useEffect, useState } from "react";

// Wall clock that re-renders every `intervalMs` — for wait timers and
// "updated at" stamps. Not an animation, so reduced motion does not apply.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
