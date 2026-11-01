"use client";

import { useRef } from "react";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { PriceRange } from "@/lib/home/price-terms";
import { MaskLines } from "../MaskLines";

type PriceTerm = { term: string; detail: string };

type HomePriceSectionProps = {
  range: PriceRange | null;
  cancelCutoffHours: number | null;
};

// What makes up the bill, one ruled row per term. The service list itself is
// the chapter above, so this chapter states the terms instead: the catalog
// price range, travel, parts, the cancel window from the admin booking policy
// and when payment happens. Rows without data drop out.
function priceTerms({
  range,
  cancelCutoffHours,
}: HomePriceSectionProps): PriceTerm[] {
  const terms: (PriceTerm | null)[] = [
    range
      ? {
          term: "Tiền công",
          detail:
            range.min === range.max
              ? `${formatVnd(range.min)} theo bảng giá từng dịch vụ.`
              : `Từ ${formatVnd(range.min)} đến ${formatVnd(range.max)}, theo bảng giá từng dịch vụ.`,
        }
      : null,
    {
      term: "Phí di chuyển",
      detail: "Đã gồm trong giá dịch vụ khi thợ đến trong khu vực nội thành.",
    },
    {
      term: "Phụ tùng",
      detail: "Tính theo giá thị trường. Thợ báo giá trước khi thay.",
    },
    cancelCutoffHours
      ? {
          term: "Hủy lịch",
          detail: `Hủy trên trang lịch sử trước giờ hẹn ít nhất ${cancelCutoffHours} giờ.`,
        }
      : null,
    {
      term: "Thanh toán",
      detail: "Sau khi bạn kiểm tra và nghiệm thu công việc.",
    },
  ];
  return terms.filter((term): term is PriceTerm => term !== null);
}

// Price chapter: the heading on the left, the billing terms as ruled rows on
// the right.
export function HomePriceSection(props: HomePriceSectionProps) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

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
      <div className="grid w-full gap-8 px-4 py-12 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-12 lg:px-10">
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Bảng giá
          </p>
          <MaskLines
            lines={["Giá niêm yết.", "Không phí ẩn."]}
            className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
          />
          <p className="mt-4 max-w-md text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Giá từng dịch vụ có trong mục Dịch vụ. Các khoản dưới đây áp dụng
            cho mọi lịch hẹn.
          </p>
        </div>
        <dl className="self-start border-b border-zinc-200 dark:border-zinc-800">
          {priceTerms(props).map((item) => (
            <div key={item.term}>
              <span
                data-rule
                aria-hidden="true"
                className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
              />
              <div
                data-chapter-row
                className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6 md:py-5"
              >
                <dt className="text-base font-bold text-zinc-900 md:text-lg dark:text-zinc-50">
                  {item.term}
                </dt>
                <dd className="text-sm text-zinc-600 md:text-base dark:text-zinc-400">
                  {item.detail}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
