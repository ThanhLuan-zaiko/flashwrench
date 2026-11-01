"use client";

import { useRef } from "react";
import { FiPlus } from "react-icons/fi";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { MaskLines } from "../MaskLines";
import { HOME_FAQ } from "./home-faq.content";

// Questions and answers under the reviews: the heading on the left and, from
// lg, the ruled rows beside it so short questions do not stretch across the
// full width. Each row is a native <details> so it works from the keyboard
// and with screen readers. The plus turns into a cross while a row is open.
export function HomeFaq() {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section ref={rootRef} aria-label="Hỏi đáp">
      <div className="grid w-full gap-8 px-4 pb-12 sm:px-6 md:pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Hỏi đáp
          </p>
          <MaskLines
            lines={["Bạn cần biết gì", "trước khi đặt lịch"]}
            className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
          />
        </div>
        <ul>
          {HOME_FAQ.map((item) => (
            <li key={item.question}>
              <span
                data-rule
                aria-hidden="true"
                className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
              />
              <details data-chapter-row className="group py-5 md:py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-bold tracking-tight text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:text-xl dark:text-zinc-50 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <FiPlus
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none dark:text-zinc-400"
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
          <li>
            <span
              data-rule
              aria-hidden="true"
              className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
            />
          </li>
        </ul>
      </div>
    </section>
  );
}
