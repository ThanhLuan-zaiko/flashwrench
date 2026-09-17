"use client";

import { FiImage } from "react-icons/fi";

type CatalogCoverStackProps = {
  id: string;
  images: string[];
  imageUrl: string;
  showPlaceholder?: boolean;
};

// Overlapping gallery thumbnails for admin rows: up to 3 covers plus a
// +N badge once saved. Shared by the category and price lists so both
// surfaces show the same thumbnails after a successful save.
export function CatalogCoverStack({
  id,
  images,
  imageUrl,
  showPlaceholder = false,
}: CatalogCoverStackProps) {
  const gallery =
    Array.isArray(images) && images.length > 0
      ? images
      : imageUrl
        ? [imageUrl]
        : [];
  if (gallery.length === 0) {
    if (!showPlaceholder) return null;
    return (
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
      >
        <FiImage aria-hidden="true" className="h-5 w-5" />
      </span>
    );
  }
  const shown = gallery.slice(0, 3);
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      <span className="sr-only">{`${gallery.length} ảnh bìa`}</span>
      {shown.map((url, index) => (
        // biome-ignore lint/performance/noImgElement: admin thumbnail of stored media asset; optimizer adds no value.
        <img
          key={`${id}-${url}`}
          src={url}
          alt=""
          loading="lazy"
          className={`h-11 w-11 rounded-xl border border-zinc-200 object-cover dark:border-zinc-800 ${index > 0 ? "-ml-4" : ""}`}
        />
      ))}
      {gallery.length > shown.length && (
        <span className="-ml-4 flex h-11 min-w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-1.5 text-[11px] font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          +{gallery.length - shown.length}
        </span>
      )}
    </span>
  );
}
