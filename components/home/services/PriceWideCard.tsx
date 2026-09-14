import { FiCheck, FiTag } from "react-icons/fi";

const PRICE_POINTS = [
  "Báo giá trước khi xác nhận",
  "Không phí ẩn",
  "Thanh toán sau khi nghiệm thu",
];

// Wide pricing promise card for the services bento grid.
export function PriceWideCard() {
  return (
    <section
      aria-label="Bảng giá minh bạch"
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiTag aria-hidden="true" className="h-4 w-4" />
        </span>
        Bảng giá minh bạch
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PRICE_POINTS.map((point) => (
          <li
            key={point}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <FiCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
