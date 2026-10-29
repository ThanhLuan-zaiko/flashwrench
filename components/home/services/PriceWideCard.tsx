import { FiCheck, FiTag } from "react-icons/fi";

const PRICE_POINTS = [
  "Báo giá trước khi xác nhận",
  "Không phí ẩn",
  "Thanh toán sau khi nghiệm thu",
];

// Wide pricing promise card: half of the bottom row on lg.
export function PriceWideCard() {
  return (
    <section
      aria-label="Bảng giá minh bạch"
      data-reveal
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:col-span-2 md:p-7 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h3 className="flex items-center gap-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-white/10 dark:text-zinc-100">
          <FiTag aria-hidden="true" className="h-4 w-4" />
        </span>
        Bảng giá minh bạch
      </h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PRICE_POINTS.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
          >
            <FiCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A5F] dark:text-zinc-300"
            />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
