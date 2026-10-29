import { FiCheck } from "react-icons/fi";
import {
  formatVnd,
  PRICE_UNIT_LABELS,
} from "@/app/admin/components/services/catalog-format";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

const PRICE_POINTS = [
  "Báo giá trước khi xác nhận",
  "Không phí ẩn",
  "Thanh toán sau khi nghiệm thu",
];

// Price receipt: the heading and promise on the left, one ruled row per live
// catalog service on the right. The section hides its list when the catalog
// is empty, but the promise points always show.
export function HomePriceSection({ services }: { services: ServiceItem[] }) {
  return (
    <section
      id="bang-gia"
      aria-label="Bảng giá"
      className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-20">
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Bảng giá
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Giá niêm yết. Không phí ẩn.
          </h2>
          <p className="mt-4 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Phí di chuyển đã bao gồm trong khu vực nội thành. Phụ tùng tính theo
            giá thị trường, báo trước khi thay.
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {PRICE_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                <FiCheck
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[#1E3A5F] dark:text-zinc-300"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
        {services.length > 0 && (
          <ul className="flex flex-col self-start border-t-2 border-zinc-900 dark:border-zinc-100">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-baseline justify-between gap-4 border-b border-zinc-200 py-4 text-sm sm:text-base dark:border-zinc-800"
              >
                <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">
                  {service.name}
                </span>
                <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-50">
                  từ {formatVnd(service.basePrice)}
                  <span className="ml-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {PRICE_UNIT_LABELS[service.priceUnit]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
