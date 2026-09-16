// UI formatting for the mechanic workspace: currency, dates, distances,
// status pills and client-side pagination over the data returned by the
// API. Imports nothing from admin components: mechanic copy uses its own
// full-datetime and travel-time vocabulary.
import type { IconType } from "react-icons";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiStar,
  FiTool,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import type {
  MechanicBookingStatus,
  MechanicIncomeState,
  MechanicPaymentState,
} from "@/lib/mechanic/mechanic.types";
import {
  MECHANIC_BOOKING_ACTIONS,
  type MechanicBookingAction,
  STATUS_LABELS,
} from "@/lib/mechanic/mechanic-status";

export { MECHANIC_BOOKING_ACTIONS, STATUS_LABELS };
export type { MechanicBookingAction };

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

// "Hôm nay, 09:30" when the date is today in Vietnam; the plain date and
// time otherwise. Never throws on a missing value.
export function formatScheduleDateTime(value: string | null): string {
  if (!value) return "Chưa hẹn giờ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa hẹn giờ";
  const now = new Date();
  const sameDay =
    date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) ===
    now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
  if (sameDay) return `Hôm nay, ${time}`;
  const day = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
  return `${day}, ${time}`;
}

export function formatShortDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

/** "Tháng 9/2026" for a "2026-09" month key. */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  if (!year || !month) return monthKey;
  return `Tháng ${Number(month)}/${year}`;
}

export function formatDistanceKm(distanceKm: number): string {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "—";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

export function formatEtaMin(etaMin: number): string {
  if (!Number.isFinite(etaMin) || etaMin <= 0) return "—";
  if (etaMin < 60) return `~${etaMin} phút`;
  const hours = Math.floor(etaMin / 60);
  const minutes = etaMin % 60;
  return minutes === 0 ? `~${hours} giờ` : `~${hours} giờ ${minutes} phút`;
}

const STATUS_TONE: Record<MechanicBookingStatus, string> = {
  pending:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  confirmed:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  mechanic_assigned:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  en_route:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  in_progress:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  completed:
    "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900",
  cancelled:
    "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500",
  no_show:
    "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500",
};
export function statusTone(status: MechanicBookingStatus): string {
  return STATUS_TONE[status];
}

export function paymentStateLabel(state: MechanicPaymentState): string {
  if (state === "paid") return "Đã thanh toán";
  if (state === "refunded") return "Đã hoàn tiền";
  return "Chưa thanh toán";
}

export function incomeStateLabel(state: MechanicIncomeState): string {
  if (state === "paid") return "Đã thu";
  if (state === "refunded") return "Đã hoàn";
  return "Chờ thu";
}

export const MECHANIC_PAGE_SIZE = 8;

export function pageCountOf(total: number, pageSize = MECHANIC_PAGE_SIZE) {
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampMechanicPage(page: number, total: number): number {
  if (!Number.isInteger(page)) return 0;
  return Math.min(Math.max(0, page), pageCountOf(total) - 1);
}

export function paginateMechanicItems<T>(items: T[], page: number): T[] {
  const current = clampMechanicPage(page, items.length);
  return items.slice(
    current * MECHANIC_PAGE_SIZE,
    current * MECHANIC_PAGE_SIZE + MECHANIC_PAGE_SIZE,
  );
}

export function pageRangeLabel(
  page: number,
  total: number,
): { start: number; end: number } {
  if (total <= 0) return { start: 0, end: 0 };
  const current = clampMechanicPage(page, total);
  return {
    start: current * MECHANIC_PAGE_SIZE + 1,
    end: Math.min(total, (current + 1) * MECHANIC_PAGE_SIZE),
  };
}

// Icons for the mechanic shell stay in one place so every section reuses
// the same vocabulary (phone, map pin, star, wrench).
export const MECHANIC_ICONS: Record<string, IconType> = {
  calendar: FiCalendar,
  check: FiCheckCircle,
  clock: FiClock,
  money: FiDollarSign,
  pin: FiMapPin,
  navigation: FiNavigation,
  phone: FiPhone,
  star: FiStar,
  tool: FiTool,
  trend: FiTrendingUp,
  user: FiUser,
};
