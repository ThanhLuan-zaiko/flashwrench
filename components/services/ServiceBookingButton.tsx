"use client";

import Link from "next/link";
import { FiArrowRight, FiLoader } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { buildBookingHref } from "@/lib/auth/auth-redirect";

type ServiceBookingButtonProps = {
  serviceId: string;
  serviceName: string;
};

const BUTTON_CLASSES =
  "flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950 bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]";

// Booking entry for one catalog card. Guests no longer detour through
// login — /booking collects their contact trio inline, so everyone
// lands on the form with the service intent preserved.
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
