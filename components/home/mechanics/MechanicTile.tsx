import { Stars } from "@/components/feedback/Stars";
import { initialsOf, skillLabel } from "@/components/home/home-card-utils";
import type { ShowcaseMechanic } from "@/lib/home/mechanic-showcase.service";

const MAX_VISIBLE_SKILLS = 3;

type MechanicTileProps = {
  item: ShowcaseMechanic;
  // Sizing from the caller: the drifting row sets a fixed width and gap, the
  // static grid lets the grid cell decide.
  className?: string;
};

// One verified mechanic as a card: a portrait on top (initials when there is
// no avatar), then name, rating, completed jobs and top skills.
export function MechanicTile({ item, className = "" }: MechanicTileProps) {
  const rated = item.ratingCount > 0;
  const visibleSkills = item.skills.slice(0, MAX_VISIBLE_SKILLS);
  const extraSkills = item.skills.length - visibleSkills.length;
  const skills = visibleSkills.map(skillLabel).join(" · ");

  return (
    <li className={className}>
      <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <span className="block aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {item.avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: user avatar served immutable from media storage; next/image optimizer hop adds no value here.
            <img
              src={item.avatarUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-5xl font-bold text-zinc-400 dark:text-zinc-600"
            >
              {initialsOf(item.displayName)}
            </span>
          )}
        </span>
        <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
          <p className="truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {item.displayName}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <Stars
              rating={item.ratingAvg}
              size="h-3.5 w-3.5"
              label={
                rated
                  ? `${item.ratingAvg.toFixed(1)} trên 5 sao`
                  : "Chưa có đánh giá"
              }
            />
            <span>
              {rated
                ? `${item.ratingAvg.toFixed(1)} · ${item.ratingCount} đánh giá`
                : "Chưa có đánh giá"}
            </span>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {item.completedJobs} đơn hoàn thành · Đã xác thực
          </p>
          {skills ? (
            <p className="mt-auto border-t border-zinc-200 pt-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {skills}
              {extraSkills > 0 ? ` · +${extraSkills}` : ""}
            </p>
          ) : null}
        </div>
      </article>
    </li>
  );
}
