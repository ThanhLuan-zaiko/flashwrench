"use client";

import { FiChevronLeft, FiChevronRight, FiPackage } from "react-icons/fi";
import { withLoopClone } from "./carousel-utils";
import { normalizeGalleryImages } from "./products-utils";
import { useLoopingCarousel } from "./useLoopingCarousel";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

const STEP_BUTTON_CLASSES =
  "flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800";
const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// Interactive image gallery for /products/[slug]: snap-aligned slides that
// auto-advance right-to-left in a seamless loop, wrap-around prev/next and a
// selectable thumbnail strip so every stored image can be inspected, not
// just the cover. The viewer remounts when the image set changes.
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const gallery = normalizeGalleryImages(images);

  if (gallery.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-zinc-200 text-zinc-300 md:h-80 dark:border-zinc-800 dark:text-zinc-700">
        <FiPackage aria-hidden="true" className="h-16 w-16" />
      </div>
    );
  }

  return (
    <GalleryViewer key={gallery.join("|")} gallery={gallery} name={name} />
  );
}

function GalleryViewer({ gallery, name }: { gallery: string[]; name: string }) {
  const total = gallery.length;
  const many = total > 1;
  const {
    rootRef,
    trackRef,
    index,
    onScroll,
    goTo,
    next,
    prev,
    interactionProps,
  } = useLoopingCarousel(total);
  const slides = withLoopClone(gallery);

  return (
    <div ref={rootRef} {...interactionProps}>
      <div className="relative">
        <ul
          ref={trackRef}
          onScroll={onScroll}
          aria-label={`Ảnh sản phẩm ${name}`}
          className={`flex snap-x snap-mandatory overflow-x-auto rounded-2xl motion-safe:scroll-smooth ${HIDE_SCROLLBAR}`}
        >
          {slides.map((src, position) => {
            const isClone = position >= total;
            return (
              <li
                key={isClone ? `${src}#loop` : src}
                aria-hidden={isClone}
                className="w-full shrink-0 snap-center"
              >
                {/* biome-ignore lint/performance/noImgElement: dynamic catalog media served immutable; next/image optimizer hop needs sharp for zero benefit. */}
                <img
                  src={src}
                  alt={isClone ? "" : name}
                  draggable={false}
                  className="h-64 w-full rounded-2xl border border-zinc-200 object-cover md:h-80 dark:border-zinc-800"
                />
              </li>
            );
          })}
        </ul>
        {many && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={prev}
              className={`${STEP_BUTTON_CLASSES} absolute top-1/2 left-3 -translate-y-1/2`}
            >
              <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={next}
              className={`${STEP_BUTTON_CLASSES} absolute top-1/2 right-3 -translate-y-1/2`}
            >
              <FiChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
            <p className="absolute right-3 bottom-3 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {index + 1}/{total}
            </p>
          </>
        )}
      </div>

      {many && (
        <ul
          aria-label="Thư viện ảnh sản phẩm"
          className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5"
        >
          {gallery.map((image, position) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Xem ảnh ${position + 1}`}
                aria-current={position === index}
                onClick={() => goTo(position)}
                className={`w-full overflow-hidden rounded-xl border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                  position === index
                    ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                {/* biome-ignore lint/performance/noImgElement: gallery thumbs served immutable from the media store. */}
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  className="h-16 w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
