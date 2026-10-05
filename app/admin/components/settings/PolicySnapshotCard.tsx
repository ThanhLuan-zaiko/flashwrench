"use client";

import {
  FiCalendar,
  FiClock,
  FiSlash,
  FiSun,
  FiUserCheck,
} from "react-icons/fi";
import { useAdminBookingConfig } from "@/hooks/booking-config";
import { useAdminBusinessHours } from "@/hooks/shop-settings";
import type { BookingPolicy } from "@/lib/booking/booking-config.types";
import {
  type BusinessHours,
  formatMinutesOfDay,
} from "@/lib/shop/business-hours.types";

const DAY_MS = 24 * 60 * 60 * 1000;

function viDay(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(date);
}

type Stat = { icon: typeof FiClock; label: string; value: string };

function bookingStatsOf(policy: BookingPolicy): Stat[] {
  return [
    {
      icon: FiClock,
      label: "Đặt trước tối thiểu",
      value:
        policy.minLeadDays > 0 ? `${policy.minLeadDays} ngày` : "Trong ngày",
    },
    {
      icon: FiCalendar,
      label: "Đặt xa tối đa",
      value:
        policy.maxAdvanceDays > 0
          ? `${policy.maxAdvanceDays} ngày`
          : "Không giới hạn",
    },
    {
      icon: FiSlash,
      label: "Đóng tự hủy",
      value:
        policy.cancelCutoffHours > 0
          ? `${policy.cancelCutoffHours} giờ trước hẹn`
          : "Bất cứ lúc nào",
    },
    {
      icon: FiUserCheck,
      label: "Đặt lịch khách",
      value: policy.guestBookingEnabled ? "Cho phép" : "Đang tắt",
    },
  ];
}

function hoursStatOf(hours: BusinessHours): Stat {
  return {
    icon: FiSun,
    label: "Giờ làm việc",
    value: hours.enabled
      ? `${formatMinutesOfDay(hours.opensAtMin)}–${formatMinutesOfDay(hours.closesAtMin)}`
      : "Cả ngày",
  };
}

// Read-only mirror of the live intake policy plus the working window,
// so admins see what customers get before touching the editable cards
// below.
export function PolicySnapshotCard() {
  const config = useAdminBookingConfig();
  const hoursConfig = useAdminBusinessHours();
  const current = config.data?.config;
  const hours = hoursConfig.data?.hours;
  const pending = config.isPending || hoursConfig.isPending;

  let preview = "Đang tải cấu hình…";
  if (current) {
    const now = Date.now();
    const from =
      current.minLeadDays > 0
        ? viDay(new Date(now + current.minLeadDays * DAY_MS))
        : "hôm nay";
    const to =
      current.maxAdvanceDays > 0
        ? viDay(new Date(now + current.maxAdvanceDays * DAY_MS))
        : null;
    preview = `Hôm nay khách đặt được khung từ ${from}${to ? ` đến ${to}` : ""}${hours?.enabled ? `, trong giờ ${formatMinutesOfDay(hours.opensAtMin)}–${formatMinutesOfDay(hours.closesAtMin)}` : ""}.`;
  }

  const stats: Stat[] = [
    ...(current
      ? bookingStatsOf(current)
      : [
          { icon: FiClock, label: "Đặt trước tối thiểu", value: "—" },
          { icon: FiCalendar, label: "Đặt xa tối đa", value: "—" },
          { icon: FiSlash, label: "Đóng tự hủy", value: "—" },
          { icon: FiUserCheck, label: "Đặt lịch khách", value: "—" },
        ]),
    hours
      ? hoursStatOf(hours)
      : { icon: FiSun, label: "Giờ làm việc", value: "—" },
  ];

  const customized = current?.isDefault === false || hours?.isDefault === false;

  return (
    <section
      aria-label="Chính sách hiện hành"
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Chính sách hiện hành
        </h2>
        <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          {customized ? "Đã tùy chỉnh" : "Mặc định"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
          >
            <stat.icon
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400"
            />
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </p>
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {pending ? "…" : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{preview}</p>
    </section>
  );
}
