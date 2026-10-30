"use client";

import { useEffect, useRef, useState } from "react";

const VISIBLE_MS = 6000;

// Remembers a numeric total across refetches and exposes the increase for
// a few seconds after it grows — e.g. "Vừa thu +250.000đ" when a realtime
// refetch lands a new collection. The first value never triggers it.
export function useIncreaseToast(value: number | undefined): number | null {
  const previous = useRef<number | undefined>(undefined);
  const [increase, setIncrease] = useState<number | null>(null);

  useEffect(() => {
    if (value === undefined) return;
    const before = previous.current;
    previous.current = value;
    if (before === undefined || value <= before) return;
    setIncrease(value - before);
    const timer = window.setTimeout(() => setIncrease(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [value]);

  return increase;
}
