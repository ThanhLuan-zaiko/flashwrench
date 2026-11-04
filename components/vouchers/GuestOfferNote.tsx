"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useMe } from "@/hooks/auth";

// One line above a catalog list telling guests that member vouchers show up
// after signing in. Cards then stay free of a repeated login hint. Accounts
// and the pending session render nothing.
export function GuestOfferNote({ next }: { next: string }) {
  const me = useMe();
  if (!me.isSuccess || me.data !== null) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-800 dark:text-zinc-400">
      Thành viên thấy voucher áp được cho từng món ngay trên danh sách.
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        prefetch
        className="inline-flex min-h-11 items-center gap-1.5 font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100"
      >
        Đăng nhập
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </p>
  );
}
