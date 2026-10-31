import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { VoucherTotals } from "@/components/vouchers/VoucherTotals";
import { formatDateTime } from "@/lib/datetime/format";
import type { CreatedBooking } from "@/services/booking.api";
import { BookingDuration } from "./BookingDuration";

type BookingSuccessProps = {
  booking: CreatedBooking;
  guest?: boolean;
};

// Confirmation after POST /api/bookings returns 201. Stays on /booking:
// no redirect to auth or anywhere else, the job is done here. The slot
// renders in the booking zone with its offset, so travelers see exactly
// when the mechanic arrives where the work happens.
export function BookingSuccess({
  booking,
  guest = false,
}: BookingSuccessProps) {
  return (
    <section
      aria-label="Đặt lịch thành công"
      data-reveal
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#1E3A5F] dark:text-zinc-50">
            <FiCheck aria-hidden="true" className="h-5 w-5 shrink-0" />
            Đặt lịch thành công
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Lịch hẹn đã được ghi nhận. Dưới đây là thông tin bạn vừa đặt.
          </p>
        </div>
        <Image
          src="/images/isometric/clipboard.svg"
          alt=""
          width={35}
          height={53}
          className="h-20 w-auto shrink-0 sm:h-28"
        />
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 border-y border-zinc-200 py-3 text-xs sm:grid-cols-2 dark:border-zinc-800">
        <div>
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Dịch vụ
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.items?.length ? (
              <ul className="flex flex-col gap-2">
                {booking.items.map((item) => (
                  <li
                    key={item.serviceId}
                    className="flex min-w-0 items-start justify-between gap-2"
                  >
                    <span className="min-w-0 break-words">
                      {item.serviceName}
                    </span>
                    <span className="shrink-0">
                      {formatVnd(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              booking.serviceName
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Khung giờ
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {formatDateTime(booking.scheduledAt, {
              timeZone: booking.timezone,
            })}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Biển số xe
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.vehiclePlate}
          </dd>
        </div>
        {booking.mechanicName && (
          <div className="sm:col-span-2">
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              Thợ phụ trách
            </dt>
            <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
              {booking.mechanicName} — đơn đã tới máy thợ, không cần gọi thêm.
            </dd>
          </div>
        )}
      </dl>
      <BookingDuration durationMin={booking.durationMin ?? null} />
      <VoucherTotals
        subtotal={booking.subtotal ?? booking.total}
        discount={booking.discount ?? 0}
        travelFee={booking.travelFee ?? 0}
        total={booking.total}
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Mã đặt lịch: {booking.bookingId}. Thợ sẽ xác nhận qua thông tin liên hệ
        của bạn trong vài phút.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/services"
          scroll={false}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-[#0F1E33] motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950"
        >
          Đặt thêm dịch vụ
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          href={guest ? `/track/booking/${booking.bookingId}` : "/account"}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {guest ? "Theo dõi lịch hẹn" : "Xem tài khoản của tôi"}
        </Link>
      </div>
    </section>
  );
}
