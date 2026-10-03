"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiGift,
} from "react-icons/fi";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { campaignDetailHref } from "../vouchers/voucher-detail-href";
import {
  promoConditionLabel,
  promoDiscountLabel,
  promoExpiryLabel,
  promoScopeLabel,
} from "./promo-format";

const AUTOPLAY_MS = 5000;

type PromoCarouselProps = {
  campaigns: PublicVoucherCampaign[];
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Hero banner for public promotions: one full-bleed cover per campaign
// with the terms overlaid on a dark gradient. Auto-rotates on a timer —
// paused on hover/focus, on hidden tabs and entirely off when the user
// prefers reduced motion, where slides still switch instantly by hand.
export function PromoCarousel({ campaigns }: PromoCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const count = campaigns.length;
  const safeIndex = count > 0 ? index % count : 0;
  const go = (next: number) => {
    if (count > 0) setIndex(((next % count) + count) % count);
  };

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reducedMotion]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Ưu đãi đang chạy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/7]">
        {campaigns.map((campaign, i) => {
          const active = i === safeIndex;
          return (
            <div
              key={campaign.id}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 motion-safe:transition-opacity motion-safe:duration-300 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              {campaign.imageUrl ? (
                <Image
                  src={campaign.imageUrl}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1152px) 100vw, 1152px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700">
                  <FiGift aria-hidden="true" className="h-16 w-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/35 to-zinc-950/10" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 sm:gap-2 sm:p-6">
                <p className="text-[11px] font-semibold tracking-wide text-zinc-300 uppercase">
                  Khuyến mãi · {promoScopeLabel(campaign.scope)}
                </p>
                <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {campaign.name}
                </h3>
                <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {promoDiscountLabel(campaign)}
                </p>
                <p className="text-xs text-zinc-300">
                  {promoConditionLabel(campaign)} · {promoExpiryLabel(campaign)}
                </p>
                {campaign.description ? (
                  <p className="mt-1 hidden max-w-xl text-sm text-zinc-200 line-clamp-2 sm:block">
                    {campaign.description}
                  </p>
                ) : null}
                <Link
                  href={campaignDetailHref(campaign.slug)}
                  scroll={false}
                  prefetch
                  aria-label={`Xem chi tiết ${campaign.name}`}
                  className="mt-2 flex w-fit min-h-[44px] items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-[0.99]"
                >
                  Xem chi tiết
                  <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <div className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full border border-white/20 bg-zinc-950/50 p-1 sm:top-4 sm:right-4">
          <button
            type="button"
            onClick={() => go(safeIndex - 1)}
            aria-label="Ưu đãi trước"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-95"
          >
            <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          {campaigns.map((campaign, i) => (
            <button
              key={campaign.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Chuyển tới ưu đãi ${i + 1}`}
              aria-current={i === safeIndex}
              className="flex h-10 w-7 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === safeIndex ? "w-5 bg-white" : "w-2 bg-white/40"
                }`}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => go(safeIndex + 1)}
            aria-label="Ưu đãi sau"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-95"
          >
            <FiChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
