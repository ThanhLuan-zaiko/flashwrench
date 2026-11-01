"use client";

import { useRef } from "react";
import { FiImage } from "react-icons/fi";
import { CarouselBars } from "@/components/home/CarouselBars";
import { useCarousel } from "@/hooks/useCarousel";

type ServiceGalleryProps = {
  photos: string[];
  active: boolean;
};

// Wide photo carousel for an open service row. GSAP advances and crossfades
// the photos while the row is open; the bars below jump to a photo directly.
export function ServiceGallery({ photos, active }: ServiceGalleryProps) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useCarousel(frameRef, photos.length, active);

  if (photos.length === 0) {
    return (
      <span className="flex aspect-[16/9] items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 md:aspect-[21/9] dark:bg-zinc-900 dark:text-zinc-700">
        <FiImage aria-hidden="true" className="h-10 w-10" />
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span
        ref={frameRef}
        className="relative block aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100 md:aspect-[21/9] dark:bg-zinc-900"
      >
        {photos.map((src, position) => (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            data-slide
            className={`absolute inset-0 h-full w-full object-cover ${position === 0 ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </span>
      {photos.length > 1 && (
        <CarouselBars
          keys={photos}
          current={current}
          itemLabel="Ảnh"
          onSelect={setCurrent}
        />
      )}
    </div>
  );
}
