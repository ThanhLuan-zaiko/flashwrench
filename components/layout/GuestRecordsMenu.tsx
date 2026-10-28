"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FiClipboard, FiSearch } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useRecentGuestRecords } from "@/hooks/guest-access";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";
import { GuestRecordMenuItem } from "./GuestRecordMenuItem";
import {
  countActiveGuestRecords,
  GUEST_LOOKUP_HREF,
  GUEST_MENU_VISIBLE,
  guestMenuLabel,
} from "./guest-records-menu.utils";

// Header shortcut to the jobs this browser filed without an account. Any tab
// of the same browser reads the same fw_gid-keyed list, so a booking placed
// in one tab is one click away in every other. Hidden for signed-in users
// (their history lives under /account) and while there is nothing to show.
export function GuestRecordsMenu() {
  const me = useMe();
  const recent = useRecentGuestRecords();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(containerRef, open, () => setOpen(false));

  const records = recent.data?.records ?? [];
  if (!me.isSuccess || me.data !== null || records.length === 0) return null;

  const activeCount = countActiveGuestRecords(records);
  const close = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={guestMenuLabel(activeCount, open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <FiClipboard aria-hidden="true" className="h-5 w-5" />
        {activeCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900"
          >
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Đơn của bạn trên trình duyệt này"
          className="fixed inset-x-4 top-[4.5rem] z-50 rounded-xl border border-zinc-200 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Đơn của bạn
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Đơn đã đặt trên trình duyệt này, kể cả ở tab khác.
            </p>
          </div>
          <div className="flex flex-col gap-0.5 p-2">
            {records.slice(0, GUEST_MENU_VISIBLE).map((record) => (
              <GuestRecordMenuItem
                key={`${record.type}:${record.id}`}
                record={record}
                onNavigate={close}
              />
            ))}
          </div>
          <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
            <Link
              href={GUEST_LOOKUP_HREF}
              role="menuitem"
              onClick={close}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiSearch aria-hidden="true" className="h-4 w-4 shrink-0" />
              Tra cứu toàn bộ đơn bằng email
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
