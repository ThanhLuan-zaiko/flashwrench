"use client";

import Link from "next/link";
import { FiArrowRight, FiLoader } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";

type ServiceBookingButtonProps = {
  serviceId: string;
  serviceName: string;
};

const BUTTON_CLASSES =
  "flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950";

// Auth-aware booking entry for one catalog card. Guests go through login
// with the booking intent preserved in `?next=` so they return here after
// signing in; logged-in customers go straight to /booking and never see
// an auth form again.
export function ServiceBookingButton({
  serviceId,
  serviceName,
}: ServiceBookingButtonProps) {
  const me = useMe();
  const bookingHref = buildBookingHref(serviceId);

  if (me.isPending) {
    return (
      <output
        aria-label="Đang kiểm tra đăng nhập"
        className={`${BUTTON_CLASSES} opacity-70`}
      >
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang kiểm tra…
      </output>
    );
  }

  if (!me.data) {
    return (
      <Link
        href={buildLoginHref(bookingHref)}
        aria-label={`Đăng nhập để đặt dịch vụ ${serviceName}`}
        className={BUTTON_CLASSES}
      >
        Đặt dịch vụ
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <Link
      href={bookingHref}
      aria-label={`Đặt dịch vụ ${serviceName}`}
      className={BUTTON_CLASSES}
    >
      Đặt dịch vụ
      <FiArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}
