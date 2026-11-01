"use client";

import { Fragment, type ReactNode, useRef } from "react";
import { useMarquee } from "@/hooks/useMarquee";
import type { MarqueeDirection } from "@/lib/motion/chapter-motion";
import { marqueeRow } from "./marquee-items";

type MarqueeTrackProps<T extends { id: string }> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  label: string;
  direction?: MarqueeDirection;
  // A decorative row repeats content another row already announces, so the
  // whole row is hidden from assistive tech.
  decorative?: boolean;
};

// Items drift in an endless loop, right to left by default. The copy is rendered
// twice side by side so the loop can wrap without a gap; the second copy is
// inert, so only one copy reaches assistive tech. Short lists repeat inside the
// copy. With reduced motion the row stays still and scrolls sideways instead.
export function MarqueeTrack<T extends { id: string }>({
  items,
  renderItem,
  label,
  direction = "left",
  decorative = false,
}: MarqueeTrackProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useMarquee(containerRef, trackRef, items.length > 0, direction);
  const row = marqueeRow(items);

  return (
    <div
      ref={containerRef}
      aria-hidden={decorative || undefined}
      className="overflow-x-auto motion-safe:overflow-hidden"
    >
      <div ref={trackRef} className="flex w-max">
        <ul aria-label={label} inert={decorative} className="flex">
          {row.map(({ key, item }) => (
            <Fragment key={key}>{renderItem(item)}</Fragment>
          ))}
        </ul>
        <ul inert className="flex" aria-hidden="true">
          {row.map(({ key, item }) => (
            <Fragment key={key}>{renderItem(item)}</Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
}
