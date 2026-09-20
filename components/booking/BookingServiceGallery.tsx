"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";
import { serviceImages } from "./service-gallery.utils";

type BookingServiceGalleryProps = {
  service: ServiceItem | null;
};

const AUTOPLAY_MS = 4500;
const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// Swipeable gallery for the picked service: snap-aligned slides that
// auto-advance, arrow buttons for pointer users and a thumbnail strip
// that jumps straight to the tapped shot. Autoplay pauses on hover,
// focus or a hidden tab and never runs for reduced-motion users.
export function BookingServiceGallery({ service }: BookingServiceGalleryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const images = useMemo(() => serviceImages(service), [service]);
  const last = images.length - 1;

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || images.length < 2) return;
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (root.matches(":hover, :focus-within, :active")) return;
      const width = track.clientWidth || 1;
      const current = Math.round(track.scrollLeft / width);
      track.scrollTo({ left: ((current + 1) % images.length) * width });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [images.length]);

  function handleScroll(event: React.UIEvent<HTMLUListElement>) {
    const track = event.currentTarget;
    const width = track.clientWidth || 1;
    setIndex(Math.min(last, Math.round(track.scrollLeft / width)));
  }

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(last, next));
    track.scrollTo({ left: clamped * track.clientWidth });
  }

  const arrowClasses =
    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-40 motion-safe:active:scale-95 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900";

  return (
    <section
      ref={rootRef}
      aria-label="Hình ảnh dịch vụ"
      className="flex flex-col gap-2"
    >
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Hình ảnh dịch vụ
      </p>
      {images.length === 0 ? (
        <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {service
            ? "Dịch vụ này chưa có hình ảnh minh họa."
            : "Chọn dịch vụ để xem hình ảnh minh họa."}
        </div>
      ) : (
        <>
          <div className="relative">
            <ul
              ref={trackRef}
              onScroll={handleScroll}
              aria-label={`Ảnh minh họa của dịch vụ ${service?.name ?? ""}`}
              className={`flex snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth ${HIDE_SCROLLBAR}`}
            >
              {images.map((src, i) => (
                <li key={src} className="w-full shrink-0 snap-center">
                  {/* biome-ignore lint/performance/noImgElement: dynamic catalog shot served immutable; next/image optimizer hop needs sharp for zero benefit. */}
                  <img
                    src={src}
                    alt={service ? `${service.name} — ảnh ${i + 1}` : ""}
                    draggable={false}
                    className="h-44 w-full rounded-2xl border border-zinc-200 object-cover sm:h-52 lg:h-60 dark:border-zinc-800"
                  />
                </li>
              ))}
            </ul>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                  aria-label="Ảnh trước"
                  className={`${arrowClasses} left-2`}
                >
                  <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  disabled={index === last}
                  aria-label="Ảnh sau"
                  className={`${arrowClasses} right-2`}
                >
                  <FiChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <ul
              aria-label="Chọn ảnh"
              className={`flex gap-2 overflow-x-auto pb-1 ${HIDE_SCROLLBAR}`}
            >
              {images.map((src, i) => (
                <li key={src} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                    aria-current={i === index}
                    className={`block h-14 w-14 overflow-hidden rounded-lg border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                      i === index
                        ? "border-zinc-900 dark:border-zinc-100"
                        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                    }`}
                  >
                    {/* biome-ignore lint/performance/noImgElement: same immutable catalog shot as the slide above. */}
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {images.length > 1 && (
            <p aria-live="polite" className="sr-only">
              Ảnh {index + 1} trên {images.length}
            </p>
          )}
        </>
      )}
    </section>
  );
}
