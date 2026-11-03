"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { MarqueeTrack } from "@/components/home/MarqueeTrack";
import { MaskLines } from "@/components/home/MaskLines";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { prefersReducedMotion } from "@/lib/motion/reveal-animation";
import {
  FOOTER_COLUMNS,
  FOOTER_HOTLINE,
  FOOTER_PHRASES,
} from "./site-footer.content";
import { footerHidden } from "./site-footer.routes";
import { SITE_NAME } from "./site-header.constants";

// Site footer on the navy brand surface: a looping strip of promises, the
// hotline and ruled link columns, then an oversized wordmark that rises into
// place on scroll. Hidden on staff portals and flow screens.
export function SiteFooter() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);
  const hidden = footerHidden(pathname);
  useChapterMotion(rootRef, !hidden);

  if (hidden) return null;

  return (
    <footer ref={rootRef} className="bg-[#FACC15] text-[#111111]">
      <div className="border-b border-[#111111]/15 py-4 md:py-5">
        <MarqueeTrack
          items={FOOTER_PHRASES}
          label="Cam kết của FlashWrench"
          renderItem={(phrase) => (
            <li className="shrink-0 pr-12 text-lg font-bold tracking-tight text-[#111111] md:text-xl">
              {phrase.text}
            </li>
          )}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 md:pt-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-12 md:gap-x-10">
          <div className="flex flex-col justify-between gap-10 md:col-span-5">
            <p className="max-w-sm text-base text-[#111111]/70">
              Sửa xe lưu động tận nơi, cứu hộ khẩn cấp và phụ tùng sẵn kho cho
              xe của bạn.
            </p>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#111111]/70 uppercase">
                {FOOTER_HOTLINE.label}
              </p>
              <a
                href={FOOTER_HOTLINE.href}
                className="mt-2 inline-flex min-h-11 items-center text-2xl font-bold tracking-tight text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FACC15]"
              >
                {FOOTER_HOTLINE.number}
              </a>
            </div>
          </div>

          <nav
            aria-label="Liên kết chân trang"
            className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6 md:col-span-7"
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold tracking-wide text-[#111111]/70 uppercase">
                  {column.title}
                </p>
                <ul className="mt-4">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <span
                        data-rule
                        aria-hidden="true"
                        className="block h-px origin-left bg-[#111111]/15"
                      />
                      <Link
                        href={link.href}
                        prefetch
                        data-chapter-row
                        className="group flex min-h-11 items-center justify-between gap-3 py-2 text-base font-semibold text-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FACC15]"
                      >
                        {link.label}
                        <FiArrowRight
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                        />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <span
                      data-rule
                      aria-hidden="true"
                      className="block h-px origin-left bg-[#111111]/15"
                    />
                  </li>
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <MaskLines
          as="p"
          lines={[SITE_NAME]}
          className="mt-12 text-[clamp(3rem,13.5vw,12rem)] leading-[0.95] font-extrabold tracking-tight text-[#111111] md:mt-16"
        />
      </div>

      <div className="mx-auto max-w-7xl mt-8 flex flex-col gap-3 border-t border-[#111111]/15 px-4 py-6 text-sm text-[#111111]/70 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. Bảo lưu mọi quyền.
        </p>
        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: prefersReducedMotion() ? "auto" : "smooth",
            })
          }
          className="inline-flex min-h-11 items-center font-semibold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FACC15]"
        >
          Về đầu trang
        </button>
      </div>
    </footer>
  );
}
