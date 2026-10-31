import { FiArrowRight } from "react-icons/fi";
import { SmartCtaLink } from "@/components/auth/SmartCtaLink";

// Closing row of the services list: the booking entry as a text link. The
// orange primary button stays with the page's closing call to action.
export function BookingRow() {
  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div
        data-chapter-row
        className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between md:gap-10"
      >
        <div>
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 md:text-xl dark:text-zinc-50">
            Đặt lịch trong 1 phút
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Chọn dịch vụ, khung giờ và địa điểm. Thợ xác nhận trong vài phút.
          </p>
        </div>
        <SmartCtaLink
          guestHref="/booking"
          authedHref="/booking"
          guestLabel={
            <>
              Đặt lịch ngay, không cần tài khoản
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
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
        />
      </div>
    </li>
  );
}
