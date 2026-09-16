import { FiCalendar, FiLoader, FiTool, FiTrendingUp } from "react-icons/fi";
import type { MechanicBookingSummary } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatVnd } from "../mechanic-format";

// Four live counters over the current queue: pending, in progress, done
// today and revenue of the finished jobs shown on this screen.
export function ScheduleStatCards({
  bookings,
  loading,
}: {
  bookings: MechanicBookingSummary[];
  loading: boolean;
}) {
  const pending = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const active = bookings.filter(
    (booking) =>
      booking.status === "en_route" || booking.status === "in_progress",
  ).length;
  const done = bookings.filter(
    (booking) => booking.status === "completed",
  ).length;
  const revenue = bookings
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + booking.total, 0);

  const cards = [
    {
      id: "pending",
      label: "Chờ nhận đơn",
      value: String(pending),
      hint: "Cần phản hồi khách",
      icon: FiCalendar,
    },
    {
      id: "active",
      label: "Đang thực hiện",
      value: String(active),
      hint: "Di chuyển và sửa xe",
      icon: FiTool,
    },
    {
      id: "done",
      label: "Đã hoàn thành",
      value: String(done),
      hint: "Trong danh sách này",
      icon: FiTrendingUp,
    },
    {
      id: "revenue",
      label: "Doanh thu",
      value: formatVnd(revenue),
      hint: "Từ các đơn đã xong",
      icon: FiLoader,
    },
  ];

  return (
    <>
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <BentoCard key={stat.id} label={stat.label}>
            <p className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {stat.label}
              </span>
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "…" : stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {stat.hint}
            </p>
          </BentoCard>
        );
      })}
    </>
  );
}
