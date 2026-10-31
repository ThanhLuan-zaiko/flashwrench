"use client";

import Link from "next/link";
import { FiArrowRight, FiLoader } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { buildRegisterHref } from "@/lib/auth/auth-redirect";

// White button on the navy closing card (orange stays with the booking bar).
const CTA_CLASSES =
  "flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99] md:w-auto";

// Bottom-of-catalog call to action. Guests are invited to create a free
// account (returning to /services afterwards); logged-in customers go
// straight to booking instead of seeing the register form again.
export function ServicesAccountCta() {
  const me = useMe();

  if (me.isPending) {
    return (
      <output
        aria-label="Đang kiểm tra đăng nhập"
        className={`${CTA_CLASSES} opacity-70`}
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
        href={buildRegisterHref("/services")}
        aria-label="Tạo tài khoản để đặt lịch"
        className={CTA_CLASSES}
      >
        Tạo tài khoản
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <Link href="/booking" aria-label="Đặt lịch ngay" className={CTA_CLASSES}>
      Đặt lịch ngay
      <FiArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}
