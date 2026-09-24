"use client";

import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPackage } from "react-icons/fi";
import { galleryStep, normalizeGalleryImages } from "./products-utils";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

const STEP_BUTTON_CLASSES =
  "flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800";

// Interactive image gallery for /products/[slug]: a large viewer with
// wrap-around prev/next plus a selectable thumbnail strip so every stored
// image can be inspected, not just the cover.
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const gallery = normalizeGalleryImages(images);
  const [selected, setSelected] = useState(0);
  const last = Math.max(gallery.length - 1, 0);
  const active = Math.min(Math.max(selected, 0), last);
  const many = gallery.length > 1;

  if (gallery.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-zinc-200 text-zinc-300 md:h-80 dark:border-zinc-800 dark:text-zinc-700">
        <FiPackage aria-hidden="true" className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        {/* biome-ignore lint/performance/noImgElement: dynamic catalog media served immutable; next/image optimizer hop needs sharp for zero benefit. */}
        <img
          src={gallery[active]}
          alt={name}
          className="h-64 w-full rounded-2xl border border-zinc-200 object-cover md:h-80 dark:border-zinc-800"
        />
        {many && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() =>
                setSelected(galleryStep(active, -1, gallery.length))
              }
              className={`${STEP_BUTTON_CLASSES} absolute top-1/2 left-3 -translate-y-1/2`}
            >
              <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={() =>
                setSelected(galleryStep(active, 1, gallery.length))
              }
              className={`${STEP_BUTTON_CLASSES} absolute top-1/2 right-3 -translate-y-1/2`}
            >
              <FiChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
            <p className="absolute right-3 bottom-3 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {active + 1}/{gallery.length}
            </p>
          </>
        )}
      </div>

      {many && (
        <ul
          aria-label="Thư viện ảnh sản phẩm"
          className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5"
        >
          {gallery.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={index === active}
                onClick={() => setSelected(index)}
                className={`w-full overflow-hidden rounded-xl border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                  index === active
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
