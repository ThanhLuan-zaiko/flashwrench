"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FiArrowRight, FiRefreshCw, FiUser } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { PromoTeaser } from "@/components/promotions/PromoTeaser";
import { useLastBooking } from "@/hooks/booking";
import {
  usePublicCatalog,
  useServiceCatalogRealtime,
} from "@/hooks/public-catalog";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import {
  parseBookingServiceParams,
  readBookingServiceParams,
} from "@/lib/booking/booking-service-selection";
import type { CreateBookingResponse } from "@/services/booking.api";
import { BookingForm } from "./BookingForm";
import { BookingSuccess } from "./BookingSuccess";
import { toBookingPrefill } from "./booking-prefill";

type BookingEntryProps = {
  serviceIds: string[];
  selectionError: string | null;
  // Null identity = guest booking: the form collects the contact trio
  // instead of reading verified account fields.
  userName: string | null;
  userContact: string | null;
};

// Booking entry for customers AND guests. Guests keep the whole flow —
// they just fill contact fields themselves and get a public tracking
// link instead of a history entry. Unknown service ids show guidance
// back to /services instead of guessing another service.
export function BookingEntry({
  serviceIds,
  selectionError,
  userName,
  userContact,
}: BookingEntryProps) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [created, setCreated] = useState<CreateBookingResponse | null>(null);
  const guest = userName === null;
  const searchParams = useSearchParams();
  const current = useMemo(
    () => parseBookingServiceParams(readBookingServiceParams(searchParams)),
    [searchParams],
  );
  const catalog = usePublicCatalog();
  useServiceCatalogRealtime(true);
  const lastBooking = useLastBooking(!guest);
  const prefill = useMemo(
    () => toBookingPrefill(lastBooking.data ?? null),
    [lastBooking.data],
  );
  const message = selectionError ?? current.error;
  const unknownService =
    catalog.isSuccess &&
    current.serviceIds.some(
      (id) => !catalog.data?.services.some((service) => service.id === id),
    );
  const ready =
    catalog.data !== undefined && !message && (guest || !lastBooking.isPending);

  if (created) {
    return (
      <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
        <BookingSuccess
          booking={created.booking}
          guest={guest && !created.user}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Đặt lịch"
        title="Đặt lịch sửa xe tận nơi."
        subtitle={
          guest
            ? "Không cần tài khoản — chọn các dịch vụ, điền thông tin liên hệ, một khung giờ, địa điểm và xe của bạn rồi xác nhận."
            : "Bạn đã đăng nhập nên không cần đăng nhập lại. Xem các dịch vụ đã chọn, điền khung giờ, địa điểm và thông tin xe rồi xác nhận."
        }
      />
      <section
        aria-label={guest ? "Đặt lịch với tư cách khách" : "Tài khoản đặt lịch"}
        data-reveal
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <FiUser aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {guest ? "Đặt lịch với tư cách khách" : userName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {guest
                ? "Sau khi đặt bạn sẽ nhận được link theo dõi tiến trình."
                : (userContact ?? "")}
            </p>
          </div>
        </div>
        {guest ? (
          <Link
            href={buildLoginHref(buildBookingHref(current.serviceIds))}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Đăng nhập
          </Link>
        ) : (
          <Link
            href="/account"
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Quản lý tài khoản
          </Link>
        )}
      </section>
      <PromoTeaser audience="booking" />

      {(catalog.isPending || (!guest && lastBooking.isPending)) && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <p className="sr-only">Đang tải dịch vụ đã chọn</p>
          <div className="h-40 rounded-2xl border border-zinc-200 bg-zinc-100 motion-safe:animate-pulse dark:border-zinc-800 dark:bg-zinc-900" />
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
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}
      {(unknownService || message) && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {message
              ? "Danh sách dịch vụ không hợp lệ"
              : "Có dịch vụ không còn khả dụng"}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {message ??
              "Cửa hàng vừa thay đổi bảng giá. Hãy bỏ các dịch vụ không còn khả dụng bên dưới hoặc chọn lại."}
          </p>
          <Link
            href="/services"
            scroll={false}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            Xem tất cả dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}
      {ready && (
        <BookingForm
          key={`${guest ? "guest" : "customer"}:${serviceIds.join(",")}`}
          services={catalog.data?.services ?? []}
          initialServiceIds={serviceIds}
          prefill={prefill}
          guest={guest}
          onCreated={setCreated}
        />
      )}
    </div>
  );
}
