import { Stars } from "@/components/feedback/Stars";
import { initialsOf, skillLabel } from "@/components/home/home-card-utils";
import type { ShowcaseMechanic } from "@/lib/home/mechanic-showcase.service";

// One verified mechanic as a static ruled row, used while the team is too
// small for a drifting marquee. Phones keep the portrait on the left with the
// text stacked beside it; from md the row reads portrait, name, rating and
// skills, then the completed-job count.
export function MechanicRow({ item }: { item: ShowcaseMechanic }) {
  const rated = item.ratingCount > 0;
  const skills = item.skills.map(skillLabel).join(" · ");

  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div
        data-chapter-row
        className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-5 md:grid-cols-[11rem_minmax(0,16rem)_minmax(0,1fr)_auto] md:items-center md:gap-x-8 md:py-6"
      >
        <span className="row-span-3 block h-24 overflow-hidden rounded-lg bg-zinc-100 md:row-span-1 md:h-28 dark:bg-zinc-900">
          {item.avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: user avatar served immutable from media storage; next/image optimizer hop adds no value here.
            <img
              src={item.avatarUrl}
              alt=""
              loading="lazy"
              data-chapter-photo
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-400 dark:text-zinc-600"
            >
              {initialsOf(item.displayName)}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
            {item.displayName}
          </span>
          <span className="mt-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Đã xác thực
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-1 text-sm text-zinc-600 md:text-base dark:text-zinc-400">
          {rated ? (
            <span className="flex flex-wrap items-center gap-2">
              <Stars
                rating={item.ratingAvg}
                size="h-3.5 w-3.5"
                label={`${item.ratingAvg.toFixed(1)} trên 5 sao`}
              />
              {item.ratingAvg.toFixed(1)} · {item.ratingCount} đánh giá
            </span>
          ) : null}
          {skills ? <span>{skills}</span> : null}
        </span>
        <span className="text-sm text-zinc-600 md:text-right dark:text-zinc-400">
          <span className="text-base font-bold text-zinc-900 md:block md:text-2xl dark:text-zinc-50">
            {item.completedJobs}
          </span>{" "}
          đơn hoàn thành
        </span>
      </div>
    </li>
  );
}
