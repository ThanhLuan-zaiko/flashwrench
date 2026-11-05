"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FiArrowRight, FiRefreshCw, FiUser } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { PromoTeaser } from "@/components/promotions/PromoTeaser";
import { TourButton } from "@/components/tour/TourButton";
import { useLastBooking } from "@/hooks/booking";
import {
  useBookingConfigRealtime,
  usePublicBookingConfig,
} from "@/hooks/booking-config";
import {
  usePublicCatalog,
  useServiceCatalogRealtime,
} from "@/hooks/public-catalog";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useBookingServiceQueue } from "@/hooks/useBookingServiceSelection";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import { nextBookingGroup } from "@/lib/booking/booking-service-queue";
import {
  parseBookingServiceParams,
  readBookingServiceParams,
} from "@/lib/booking/booking-service-selection";
import type { CreateBookingResponse } from "@/services/booking.api";
import { BookingForm } from "./BookingForm";
import { BookingSuccess } from "./BookingSuccess";
import { toBookingPrefill } from "./booking-prefill";
import { BOOKING_TOUR_NAME } from "./tour/booking-tour.steps";

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
  const [placed, setPlaced] = useState<{
    response: CreateBookingResponse;
    urlKey: string;
  } | null>(null);
  const guest = userName === null;
  const searchParams = useSearchParams();
  const current = useMemo(
    () => parseBookingServiceParams(readBookingServiceParams(searchParams)),
    [searchParams],
  );
  // The confirmation belongs to its URL: moving to the next queued services
  // brings the form back without remounting it on the services just booked.
  const urlKey = current.serviceIds.join(",");
  const created = placed?.urlKey === urlKey ? placed.response : null;
  const queue = useBookingServiceQueue();
  const catalog = usePublicCatalog();
  useServiceCatalogRealtime(true);
  // Guest intake is an admin knob; subscribe here too so the gate below
  // reacts live even while the form itself is not mounted.
  const bookingConfig = usePublicBookingConfig();
  useBookingConfigRealtime(true);
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
  // Guests can keep browsing services, but submitting needs a sign-in
  // while the shop has guest intake switched off.
  const guestBlocked =
    guest && bookingConfig.data?.guestBookingEnabled === false;

  if (created) {
    const services = catalog.data?.services ?? [];
    const nextIds = nextBookingGroup(queue.serviceIds, services);
    return (
      <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
        <BookingSuccess
          booking={created.booking}
          guest={guest && !created.user}
          nextServices={services.filter((service) =>
            queue.serviceIds.includes(service.id),
          )}
          nextHref={nextIds.length > 0 ? buildBookingHref(nextIds) : null}
          onContinue={() => queue.removeServiceIds(nextIds)}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-4 sm:gap-6 md:gap-8">
      {/* Phones go straight into the wizard (the task bar names the
      screen); the intro, account card and promo show from sm up. */}
      <div className="hidden sm:block">
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
      </div>
      <section
        aria-label={guest ? "Đặt lịch với tư cách khách" : "Tài khoản đặt lịch"}
        data-reveal
        className="flex flex-col gap-3 border-y border-zinc-200 py-4 max-sm:hidden lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800"
      >
        <div className="flex items-start gap-3">
          <FiUser
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-zinc-800 dark:text-zinc-200"
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {guest ? "Đặt lịch với tư cách khách" : userName}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {guest
                ? "Sau khi đặt bạn sẽ nhận được link theo dõi tiến trình."
                : (userContact ?? "")}
            </p>
            <PromoTeaser audience="booking" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TourButton
            tour={BOOKING_TOUR_NAME}
            ariaLabel="Bắt đầu hướng dẫn đặt lịch"
          />
          {guest ? (
            <Link
              href={buildLoginHref(buildBookingHref(current.serviceIds))}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-[#111111] motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Đăng nhập
            </Link>
          ) : (
            <Link
              href="/account"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-[#111111] motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Quản lý tài khoản
            </Link>
          )}
        </div>
      </section>

      {(catalog.isPending || (!guest && lastBooking.isPending)) && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <p className="sr-only">Đang tải dịch vụ đã chọn</p>
          <div className="h-32 rounded-lg bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900" />
        </div>
      )}
      {catalog.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được dịch vụ đã chọn.</p>
          <p className="mt-1 text-xs">Vui lòng kiểm tra mạng rồi thử lại.</p>
          <button
            type="button"
            onClick={() => void catalog.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-600 px-4 py-2 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}
      {(unknownService || message) && (
        <div data-reveal className="py-8 text-center">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {message
              ? "Danh sách dịch vụ không hợp lệ"
              : "Có dịch vụ không còn khả dụng"}
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {message ??
              "Cửa hàng vừa thay đổi bảng giá. Hãy bỏ các dịch vụ không còn khả dụng bên dưới hoặc chọn lại."}
          </p>
          <Link
            href="/services"
            scroll={false}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold motion-safe:transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950 bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
          >
            Xem tất cả dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}
      {ready && guestBlocked && (
        <section
          aria-label="Yêu cầu đăng nhập"
          data-reveal
          className="py-8 text-center"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Cửa hàng đang yêu cầu đăng nhập để đặt lịch
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
            Đăng nhập để tiếp tục — dịch vụ bạn đã chọn được giữ nguyên. Nếu cần
            gấp, hãy gọi hotline để được hỗ trợ.
          </p>
          <Link
            href={buildLoginHref(buildBookingHref(current.serviceIds))}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold motion-safe:transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950 bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
          >
            Đăng nhập để đặt lịch
          </Link>
        </section>
      )}
      {ready && !guestBlocked && (
        <BookingForm
          key={`${guest ? "guest" : "customer"}:${serviceIds.join(",")}`}
          services={catalog.data?.services ?? []}
          initialServiceIds={serviceIds}
          prefill={prefill}
          guest={guest}
          onCreated={(response) => setPlaced({ response, urlKey })}
        />
      )}
    </div>
  );
}
