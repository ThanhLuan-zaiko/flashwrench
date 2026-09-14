import Link from "next/link";
import { FiLifeBuoy } from "react-icons/fi";

// Hero 2x2 card: giant 24/7 display plus rescue booking entry.
// Top-left on lg, first in DOM on mobile.
export function RescueHeroCard() {
  return (
    <section
      aria-label="Cứu hộ khẩn cấp"
      data-reveal
      className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2 md:p-5 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <p className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <FiLifeBuoy aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Cứu hộ khẩn cấp
          </span>
        </p>
        <p className="mt-4 text-6xl font-bold tracking-tight text-zinc-900 lg:text-7xl dark:text-zinc-50">
          24/7
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Hết bình, thủng lốp, chết máy giữa đường? Thợ trực luôn sẵn sàng lên
          đường.
        </p>
      </div>
      <div>
        <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 rounded-xl bg-zinc-100 py-3 dark:divide-zinc-800 dark:bg-zinc-900">
          {["Giá mở cửa rõ ràng", "Tính theo km", "Phụ phí đêm minh bạch"].map(
            (label) => (
              <div
                key={label}
                className="flex items-center justify-center px-2 text-center"
              >
                <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {label}
                </dt>
              </div>
            ),
          )}
        </dl>
        <Link
          href="/register"
          className="mt-4 flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          Đặt cứu hộ ngay
        </Link>
      </div>
    </section>
  );
}
