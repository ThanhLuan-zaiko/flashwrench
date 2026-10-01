"use client";

import { FiCheckCircle, FiTool, FiUserPlus } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";
import { Stars } from "@/components/feedback/Stars";
import {
  averageRatingOf,
  initialsOf,
  skillLabel,
} from "@/components/home/home-card-utils";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { ShowcaseMechanic } from "@/lib/home/mechanic-showcase.service";

const MAX_VISIBLE_SKILLS = 3;

function MechanicShowcaseCard({ item }: { item: ShowcaseMechanic }) {
  const rated = item.ratingCount > 0;
  const visibleSkills = item.skills.slice(0, MAX_VISIBLE_SKILLS);
  const extraSkills = item.skills.length - visibleSkills.length;

  return (
    <li
      data-reveal
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {initialsOf(item.displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.displayName}
          </p>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <FiCheckCircle aria-hidden="true" className="h-3.5 w-3.5" />
            Thợ đã xác thực
          </span>
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <FiTool aria-hidden="true" className="h-3.5 w-3.5" />
        {item.completedJobs} đơn hoàn thành
      </p>
      {visibleSkills.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              {skillLabel(skill)}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              +{extraSkills}
            </span>
          )}
        </p>
      )}
    </li>
  );
}

// Trusted mechanics wall on the landing page. Data is fetched server-side;
// when no verified mechanic exists yet the whole section stays out of the
// page instead of showing an empty shell.
export function MechanicsBento({ items }: { items: ShowcaseMechanic[] }) {
  const rootRef = useBentoReveal<HTMLElement>();
  if (items.length === 0) return null;

  const avg = averageRatingOf(items.map((item) => item.ratingAvg));
  const jobs = items.reduce((sum, item) => sum + item.completedJobs, 0);

  return (
    <section ref={rootRef} aria-label="Thợ uy tín">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div data-reveal className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Thợ uy tín
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Đội thợ được khách hàng chấm điểm từng đơn.
            </h2>
            <p className="mt-2 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              Mọi thợ đều xác thực danh tính và được khách hàng đánh giá sau mỗi
              lần sửa.
            </p>
          </div>
          <dl
            data-reveal
            className="flex items-center gap-5 rounded-2xl border border-zinc-200 px-4 py-3 md:px-5 dark:border-zinc-800"
          >
            <div className="flex flex-col">
              <dt className="sr-only">Điểm đánh giá trung bình</dt>
              <dd className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {avg > 0 ? avg.toFixed(1) : "—"}
                </span>
                <Stars rating={avg} size="h-3.5 w-3.5" />
              </dd>
            </div>
            <div
              aria-hidden="true"
              className="h-8 w-px bg-zinc-200 dark:bg-zinc-800"
            />
            <div className="flex flex-col">
              <dd className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {jobs}
              </dd>
              <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                đơn hoàn thành
              </dt>
            </div>
          </dl>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {items.map((item) => (
            <MechanicShowcaseCard key={item.id} item={item} />
          ))}
        </ul>
        <div data-reveal className="mt-6 flex justify-center">
          <SmartCtaLink
            guestHref="/booking"
            authedHref="/booking"
            guestLabel={
              <>
                <FiUserPlus aria-hidden="true" className="h-4 w-4" />
                Đặt lịch với đội ngũ này
              </>
            }
            authedLabel={
              <>
                <FiUserPlus aria-hidden="true" className="h-4 w-4" />
                Đặt lịch với đội ngũ này
              </>
            }
            guestAriaLabel="Đặt lịch với đội ngũ này không cần tài khoản"
            authedAriaLabel="Đặt lịch với đội ngũ này"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          />
        </div>
      </div>
    </section>
  );
}
