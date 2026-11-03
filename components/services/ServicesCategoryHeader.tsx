import { FiImage } from "react-icons/fi";
import { servicePhotos } from "@/components/home/services/service-photos";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";

// Phones show two photos, wider screens the first three.
const HEADER_PHOTOS = 3;

type ServicesCategoryHeaderProps = {
  category: ServiceCategoryItem;
  serviceCount: number;
};

// Intro for one category tab on /services: name, description and live
// service count beside a strip of the category gallery. It renders on a tab
// switch, so it carries no chapter-motion attributes and shows at once.
export function ServicesCategoryHeader({
  category,
  serviceCount,
}: ServicesCategoryHeaderProps) {
  const photos = servicePhotos(category).slice(0, HEADER_PHOTOS);

  return (
    <section
      aria-label={`Loại hình ${category.name}`}
      className="grid gap-5 border-t border-zinc-200 pt-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-10 dark:border-zinc-800"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-[#111111] uppercase dark:text-zinc-400">
          Loại hình
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
          {category.name}
        </h2>
        {category.description ? (
          <p className="mt-2 text-sm text-zinc-600 md:text-base dark:text-zinc-400">
            {category.description}
          </p>
        ) : null}
        <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {serviceCount} dịch vụ trong loại hình này
        </p>
      </div>
      <div className="flex h-28 gap-2 sm:h-36 md:h-44">
        {photos.length > 0 ? (
          photos.map((url, index) => (
            <span
              key={url}
              className={`relative flex-1 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 ${index > 1 ? "hidden sm:block" : "block"}`}
            >
              {/* biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit. */}
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </span>
          ))
        ) : (
          <span className="flex flex-1 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700">
            <FiImage aria-hidden="true" className="h-10 w-10" />
          </span>
        )}
      </div>
    </section>
  );
}
