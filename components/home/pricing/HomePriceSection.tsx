"use client";

import { useRef } from "react";
import { FiImage } from "react-icons/fi";
import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import { useChapterExtras } from "@/hooks/useChapterExtras";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { MaskLines } from "../MaskLines";

const PRICE_POINTS = [
  "Báo giá trước khi xác nhận",
  "Không phí ẩn",
  "Thanh toán sau khi nghiệm thu",
];

// Price chapter: the heading and promises on the left, one ruled row per live
// catalog service on the right, each with its photo. The promises always
// show; the list hides when the catalog is empty.
export function HomePriceSection({ services }: { services: ServiceItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  useChapterExtras(rootRef);

  return (
    <section
      ref={rootRef}
      id="bang-gia"
      aria-label="Bảng giá"
      className="scroll-mt-20"
    >
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <span
          data-rule
          aria-hidden="true"
          className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
        />
      </div>
      <div className="grid w-full gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-20 lg:px-10">
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Bảng giá
          </p>
          <MaskLines
            lines={["Giá niêm yết.", "Không phí ẩn."]}
            className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50"
          />
          <p className="mt-4 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Phí di chuyển đã bao gồm trong khu vực nội thành. Phụ tùng tính theo
            giá thị trường, báo trước khi thay.
          </p>
          <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {PRICE_POINTS.map((point) => (
              <li
                key={point}
                data-chapter-row
                className="py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
        {services.length > 0 && (
          <ul className="self-start">
            {services.map((service) => (
              <li key={service.id}>
                <span
                  data-rule
                  aria-hidden="true"
                  className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
                />
                <div
                  data-chapter-row
                  className="flex items-center gap-4 py-4 md:gap-6"
                >
                  <span className="block h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100 md:h-20 md:w-32 dark:bg-zinc-900">
                    {service.imageUrl ? (
                      // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
                      <img
                        src={service.imageUrl}
                        alt=""
                        loading="lazy"
                        data-chapter-photo
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                        <FiImage aria-hidden="true" className="h-6 w-6" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-zinc-900 sm:text-base dark:text-zinc-50">
                    {service.name}
                  </span>
                  <span className="shrink-0 text-right text-sm font-bold text-zinc-900 sm:text-lg dark:text-zinc-50">
                    từ{" "}
                    <span data-count-to={service.basePrice}>
                      {formatVnd(service.basePrice)}
                    </span>
                    <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {PRICE_UNIT_LABELS[service.priceUnit]}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
