import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";

// Booking action card: half of the bottom row on lg. Its orange button is
// the same booking action as the hero, so the page keeps one primary CTA.
export function BookingWideCard() {
  return (
    <section
      aria-label="Đặt lịch trong 1 phút"
      data-reveal
      className="flex flex-col justify-between gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:col-span-2 md:p-7 lg:col-span-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h3 className="flex items-center gap-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-white/10 dark:text-zinc-100">
            <FiCalendar aria-hidden="true" className="h-4 w-4" />
          </span>
          Đặt lịch trong 1 phút
        </h3>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Chọn dịch vụ, khung giờ và địa điểm. Thợ xác nhận trong vài phút.
        </p>
      </div>
      <SmartCtaLink
        guestHref="/booking"
        authedHref="/booking"
        guestLabel={
          <>
            Đặt lịch ngay — không cần tài khoản
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </>
        }
        authedLabel={
          <>
            Đặt lịch ngay
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </>
        }
        guestAriaLabel="Đặt lịch ngay không cần tài khoản"
        authedAriaLabel="Đặt lịch ngay"
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950"
      />
    </section>
  );
}
