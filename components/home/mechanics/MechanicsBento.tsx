"use client";

import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { averageRatingOf } from "@/components/home/home-card-utils";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { ShowcaseMechanic } from "@/lib/home/mechanic-showcase.service";
import { MarqueeTrack } from "../MarqueeTrack";
import { MaskLines } from "../MaskLines";
import { shouldDrift } from "../marquee-items";
import { MechanicTile } from "./MechanicTile";

// Trusted mechanics chapter. Data is fetched server-side; when no verified
// mechanic exists yet the whole section stays out of the page.
export function MechanicsBento({ items }: { items: ShowcaseMechanic[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  if (items.length === 0) return null;

  const avg = averageRatingOf(items.map((item) => item.ratingAvg));
  const jobs = items.reduce((sum, item) => sum + item.completedJobs, 0);

  return (
    <section ref={rootRef} aria-label="Thợ uy tín">
      <div className="mx-auto max-w-7xl w-full px-4 pb-12 sm:px-6 md:pb-12 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Thợ uy tín
            </p>
            <MaskLines
              lines={["Đội thợ được khách hàng", "chấm điểm từng đơn"]}
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
            />
          </div>
          <dl className="flex gap-8 text-zinc-900 dark:text-zinc-50">
            {avg > 0 ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Điểm trung bình
                </dt>
                <dd className="text-2xl font-bold tracking-tight">
                  {avg.toFixed(1)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Đơn hoàn thành
              </dt>
              <dd className="text-2xl font-bold tracking-tight">{jobs}</dd>
            </div>
          </dl>
        </div>
        {shouldDrift(items.length) ? (
          <>
            <span
              data-rule
              aria-hidden="true"
              className="mt-6 block h-px origin-left bg-zinc-200 md:mt-8 dark:bg-zinc-800"
            />
            <div className="mt-6 flex flex-col gap-8 md:mt-8">
              <MarqueeTrack
                items={items}
                label="Thợ uy tín"
                renderItem={(item) => (
                  <MechanicTile
                    item={item}
                    className="w-64 shrink-0 pr-10 md:w-72"
                  />
                )}
              />
              <MarqueeTrack
                items={[...items].reverse()}
                label="Thợ uy tín, cuộn ngược"
                direction="right"
                decorative
                renderItem={(item) => (
                  <MechanicTile
                    item={item}
                    className="w-64 shrink-0 pr-10 md:w-72"
                  />
                )}
              />
            </div>
          </>
        ) : (
          <ul
            aria-label="Thợ uy tín"
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-8 md:gap-6 lg:grid-cols-4"
          >
            {items.map((item) => (
              <MechanicTile key={item.id} item={item} className="flex" />
            ))}
          </ul>
        )}
        <div data-chapter-row className="mt-8">
          <SmartCtaLink
            guestHref="/booking"
            authedHref="/booking"
            guestLabel={
              <>
                Đặt lịch với đội ngũ này
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </>
            }
            authedLabel={
              <>
                Đặt lịch với đội ngũ này
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </>
            }
            guestAriaLabel="Đặt lịch với đội ngũ này không cần tài khoản"
            authedAriaLabel="Đặt lịch với đội ngũ này"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
          />
        </div>
      </div>
    </section>
  );
}
