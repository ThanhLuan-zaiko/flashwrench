"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FiArrowRight, FiRefreshCw, FiUser } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useLastBooking } from "@/hooks/booking";
import { usePublicCatalog } from "@/hooks/public-catalog";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BookingForm } from "./BookingForm";
import { toBookingPrefill } from "./booking-prefill";

type BookingEntryProps = {
  serviceId: string | null;
  userName: string;
  userContact: string;
};

// Authenticated booking entry. The server already bounced guests to login
// with `?next=/booking...`, so reaching here proves no second login is
// needed. Unknown service ids show guidance back to /services instead of
// guessing another service; otherwise the real booking form renders.
export function BookingEntry({
  serviceId,
  userName,
  userContact,
}: BookingEntryProps) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const catalog = usePublicCatalog();
  const lastBooking = useLastBooking();

  const selected = useMemo(() => {
    if (!serviceId) return null;
    return (
      catalog.data?.services.find((service) => service.id === serviceId) ?? null
    );
  }, [catalog.data, serviceId]);

  const prefill = useMemo(
    () => toBookingPrefill(lastBooking.data ?? null),
    [lastBooking.data],
  );

  const unknownService =
    catalog.isSuccess && serviceId !== null && selected === null;
  const ready = catalog.isSuccess && !unknownService && !lastBooking.isPending;

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Đặt lịch"
        title="Đặt lịch sửa xe tận nơi."
        subtitle="Bạn đã đăng nhập nên không cần đăng nhập lại. Điền khung giờ, địa điểm và thông tin xe rồi xác nhận."
      />

      <section
        aria-label="Tài khoản đặt lịch"
        data-reveal
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <FiUser aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {userName}
            </p>
            {userContact && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {userContact}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/account"
          className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Quản lý tài khoản
        </Link>
      </section>

      {(catalog.isPending || lastBooking.isPending) && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <p className="sr-only">Đang tải dịch vụ đã chọn</p>
          <div className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      )}

      {catalog.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được dịch vụ đã chọn.</p>
          <p className="mt-1 text-xs">Vui lòng kiểm tra mạng rồi thử lại.</p>
          <button
            type="button"
            onClick={() => void catalog.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {unknownService && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Dịch vụ này không còn khả dụng
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Cửa hàng vừa thay đổi bảng giá. Hãy chọn một dịch vụ đang có.
          </p>
          <Link
            href="/services"
            scroll={false}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            Xem tất cả dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {ready && (
        <BookingForm
          preselected={selected}
          services={catalog.data?.services ?? []}
          initialServiceId={serviceId}
          prefill={prefill}
        />
      )}
    </div>
  );
}
