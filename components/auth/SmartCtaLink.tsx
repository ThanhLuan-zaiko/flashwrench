"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiLoader } from "react-icons/fi";
import { useMe } from "@/hooks/auth";

type SmartCtaLinkProps = {
  guestHref: string;
  authedHref: string;
  guestLabel: ReactNode;
  authedLabel: ReactNode;
  className?: string;
  guestAriaLabel?: string;
  authedAriaLabel?: string;
};

// Booking call to action that never points a logged-in customer at an auth
// page. Guests keep the provided auth href (login/register with `?next=`
// preserved); customers go straight to the booking entry. While the session
// is loading the link stays disabled so a guest href never flashes.
export function SmartCtaLink({
  guestHref,
  authedHref,
  guestLabel,
  authedLabel,
  className,
  guestAriaLabel,
  authedAriaLabel,
}: SmartCtaLinkProps) {
  const me = useMe();

  if (me.isPending) {
    return (
      <output aria-label="Đang kiểm tra đăng nhập" className={className}>
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
      <Link href={guestHref} aria-label={guestAriaLabel} className={className}>
        {guestLabel}
      </Link>
    );
  }

  return (
    <Link href={authedHref} aria-label={authedAriaLabel} className={className}>
      {authedLabel}
    </Link>
  );
}
