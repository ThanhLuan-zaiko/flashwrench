import { Stars } from "@/components/feedback/Stars";
import { initialsOf, skillLabel } from "@/components/home/home-card-utils";
import type { ShowcaseMechanic } from "@/lib/home/mechanic-showcase.service";

const MAX_VISIBLE_SKILLS = 3;

// One verified mechanic: a large portrait that opens on scroll (initials when
// there is no avatar), then name, rating, completed jobs and top skills.
export function MechanicTile({ item }: { item: ShowcaseMechanic }) {
  const rated = item.ratingCount > 0;
  const visibleSkills = item.skills.slice(0, MAX_VISIBLE_SKILLS);
  const extraSkills = item.skills.length - visibleSkills.length;
  const skills = visibleSkills.map(skillLabel).join(" · ");

  return (
    <li className="min-w-0">
      <div data-chapter-row className="flex flex-col gap-3">
        <span className="block aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
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
              className="flex h-full w-full items-center justify-center text-5xl font-bold text-zinc-400 dark:text-zinc-600"
            >
              {initialsOf(item.displayName)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {item.displayName}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
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
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {item.completedJobs} đơn hoàn thành · Đã xác thực
          </p>
          {skills ? (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {skills}
              {extraSkills > 0 ? ` · +${extraSkills}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
