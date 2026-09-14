import Link from "next/link";
import { FiArrowRight, FiSettings } from "react-icons/fi";
import { BentoCard } from "./BentoCard";

// Hero 2x2 card: service catalogue summary plus configuration entry.
export function ServicesHeroCard() {
  return (
    <BentoCard
      label="Cấu hình dịch vụ"
      className="flex flex-col justify-between sm:col-span-2 lg:row-span-2"
    >
      <div>
        <p className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <FiSettings aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Cấu hình dịch vụ
          </span>
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance text-zinc-900 md:text-3xl dark:text-zinc-50">
          Bảng giá rõ ràng, bật tắt linh hoạt
        </h2>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          Quản lý loại hình sửa chữa và bảng giá áp dụng cho khách hàng trên
          toàn hệ thống.
        </p>
      </div>

      <div>
        <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 rounded-xl bg-zinc-100 py-3 dark:divide-zinc-800 dark:bg-zinc-900">
          {[
            { value: "3", label: "Loại hình" },
            { value: "3/3", label: "Đang áp dụng" },
            { value: "0", label: "Tạm tắt" },
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
        <Link
          href="/admin"
          className="mt-4 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Về dashboard tổng quan
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </BentoCard>
  );
}
