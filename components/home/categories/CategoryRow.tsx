import Link from "next/link";
import { FiArrowRight, FiImage } from "react-icons/fi";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";
import { servicePhotos } from "../services/service-photos";

// Desktop strip length; phones show the cover only.
const STRIP_PHOTOS = 3;

type CategoryRowProps = {
  category: ServiceCategoryItem;
  index: number;
};

// One service category as a ruled row linking to its /services tab. Phones
// keep the cover on the left with the text stacked beside it; from md the
// row reads number, name and count, description, then a strip of the
// category gallery.
export function CategoryRow({ category, index }: CategoryRowProps) {
  const photos = servicePhotos(category).slice(0, STRIP_PHOTOS);

  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <Link
        href={`/services/${encodeURIComponent(category.slug)}`}
        prefetch
        aria-label={`Xem ${category.serviceCount} dịch vụ ${category.name}`}
        data-chapter-row
        className="group grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] sm:grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[3rem_minmax(0,12rem)_minmax(0,1fr)_minmax(0,20rem)] md:items-center md:gap-x-6 xl:grid-cols-[4rem_minmax(0,14rem)_minmax(0,1fr)_minmax(0,26rem)] xl:gap-x-8 md:py-6 dark:focus-visible:ring-zinc-100"
      >
        <span className="hidden self-start pt-1 text-sm font-semibold text-zinc-500 tabular-nums md:block dark:text-zinc-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="row-span-2 flex h-20 gap-2 sm:h-24 md:order-last md:row-span-1 md:h-28">
          {photos.length > 0 ? (
            photos.map((url, photoIndex) => (
              <span
                key={url}
                className={`relative flex-1 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 ${photoIndex > 0 ? "hidden md:block" : "block"}`}
              >
                {/* biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit. */}
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  data-chapter-photo={photoIndex === 0 ? "" : undefined}
                  className="h-full w-full object-cover"
                />
              </span>
            ))
          ) : (
            <span className="flex flex-1 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700">
              <FiImage aria-hidden="true" className="h-8 w-8" />
            </span>
          )}
        </span>
        <span className="min-w-0 self-end md:self-auto">
          <span className="block text-base font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
            {category.name}
          </span>
          <span className="mt-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {category.serviceCount} dịch vụ
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-start gap-2 self-start md:self-auto">
          {category.description ? (
            <span className="line-clamp-2 text-sm text-zinc-600 md:line-clamp-3 md:text-base dark:text-zinc-400">
              {category.description}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A5F] underline-offset-4 group-hover:underline dark:text-zinc-100">
            Xem dịch vụ
            <FiArrowRight
              aria-hidden="true"
              className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </span>
      </Link>
    </li>
  );
}
