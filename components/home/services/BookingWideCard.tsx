import Link from "next/link";
import { FiArrowRight, FiCalendar } from "react-icons/fi";

// Wide booking action card for the services bento grid.
export function BookingWideCard() {
  return (
    <section
      aria-label="Đặt lịch trong 1 phút"
      data-reveal
      className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <FiCalendar aria-hidden="true" className="h-4 w-4" />
          </span>
          Đặt lịch trong 1 phút
        </h3>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Chọn dịch vụ, khung giờ và địa điểm. Thợ xác nhận trong vài phút.
        </p>
      </div>
      <Link
        href="/register"
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
      >
        Tạo tài khoản miễn phí
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
