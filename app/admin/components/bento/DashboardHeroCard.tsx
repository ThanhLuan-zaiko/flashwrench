import Link from "next/link";
import { FiArrowRight, FiZap } from "react-icons/fi";
import { BentoCard } from "./BentoCard";

// Hero 2x2 card: operational summary plus primary admin shortcuts.
// Lives top-left on lg, first in DOM on mobile.
export function DashboardHeroCard() {
  return (
    <BentoCard
      label="Tổng quan vận hành"
      className="flex flex-col justify-between sm:col-span-2 lg:row-span-2"
    >
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-zinc-800">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
            />
            Vận hành hôm nay
          </span>
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance text-zinc-900 md:text-3xl dark:text-zinc-50">
          Hệ thống sửa xe lưu động ổn định
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Theo dõi lịch đặt, cứu hộ, thợ trực tuyến và doanh thu tại một nơi. Số
          liệu chi tiết sẽ hiện khi API thống kê được kết nối.
        </p>
      </div>

      <div>
        <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 rounded-xl bg-zinc-100 py-3 dark:divide-zinc-800 dark:bg-zinc-900">
          {[
            { value: "—", label: "Lịch hôm nay" },
            { value: "—", label: "Cứu hộ mở" },
            { value: "—", label: "Thợ trực tuyến" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col px-3 text-center">
              <dd className="order-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {item.value}
              </dd>
              <dt className="order-2 mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </dt>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/admin/users"
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            <FiZap aria-hidden="true" className="h-4 w-4" />
            Duyệt thợ ngay
          </Link>
          <Link
            href="/admin/services/categories"
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Cấu hình dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </BentoCard>
  );
}
