import Link from "next/link";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { CreatedBooking } from "@/services/booking.api";

type BookingSuccessProps = {
  booking: CreatedBooking;
};

function formatScheduled(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Confirmation after POST /api/bookings returns 201. Stays on /booking:
// no redirect to auth or anywhere else, the job is done here.
export function BookingSuccess({ booking }: BookingSuccessProps) {
  return (
    <section
      aria-label="Đặt lịch thành công"
      data-reveal
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiCheck aria-hidden="true" className="h-4 w-4" />
        </span>
        Đặt lịch thành công!
      </p>
      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Dịch vụ
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.serviceName}
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Khung giờ
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {formatScheduled(booking.scheduledAt)}
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Biển số xe
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.vehiclePlate}
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900">
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Tạm tính
          </dt>
          <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
            {formatVnd(booking.total)}
          </dd>
        </div>
        {booking.mechanicName && (
          <div className="rounded-xl bg-zinc-100 px-3 py-2.5 sm:col-span-2 dark:bg-zinc-900">
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              Thợ phụ trách
            </dt>
            <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
              {booking.mechanicName} — đơn đã tới máy thợ, không cần gọi thêm.
            </dd>
          </div>
        )}
      </dl>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Mã đặt lịch: {booking.bookingId}. Thợ sẽ xác nhận qua thông tin liên hệ
        của bạn trong vài phút.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/services"
          scroll={false}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          Đặt thêm dịch vụ
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          href="/account"
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Xem tài khoản của tôi
        </Link>
      </div>
    </section>
  );
}
