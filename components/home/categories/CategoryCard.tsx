import Link from "next/link";
import { FiArrowRight, FiImage } from "react-icons/fi";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";
import { servicePhotos } from "../services/service-photos";

type CategoryCardProps = {
  category: ServiceCategoryItem;
};

// One service category as a card linking to its /services tab: the cover on
// top, then the name, the service count, the description and a link.
export function CategoryCard({ category }: CategoryCardProps) {
  const cover = servicePhotos(category)[0] ?? null;

  return (
    <li data-chapter-row className="flex">
      <Link
        href={`/services/${encodeURIComponent(category.slug)}`}
        prefetch
        aria-label={`Xem ${category.serviceCount} dịch vụ ${category.name}`}
        className="group flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors duration-200 hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:focus-visible:ring-zinc-100"
      >
        <span className="relative block aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {cover ? (
            // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
            <img
              src={cover}
              alt=""
              loading="lazy"
              data-chapter-photo
              className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <FiImage aria-hidden="true" className="h-8 w-8" />
            </span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-2 p-4 md:p-5">
          <span className="text-base font-bold tracking-tight text-zinc-900 md:text-lg dark:text-zinc-50">
            {category.name}
          </span>
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {category.serviceCount} dịch vụ
          </span>
          {category.description ? (
            <span className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
              {category.description}
            </span>
          ) : null}
          <span className="mt-auto inline-flex items-center gap-1.5 border-t border-zinc-200 pt-3 text-sm font-bold text-[#1E3A5F] dark:border-zinc-800 dark:text-zinc-100">
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
