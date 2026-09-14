import { FiActivity, FiCheckCircle, FiClock, FiInbox } from "react-icons/fi";
import { BentoCard } from "./BentoCard";

// Wide activity feed. Empty state uses structured muted rows
// instead of a single dashed box, so the card keeps its rhythm.
export function DashboardActivityCard() {
  return (
    <BentoCard label="Hoạt động gần đây" className="sm:col-span-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiActivity aria-hidden="true" className="h-4 w-4" />
        </span>
        Hoạt động gần đây
      </h3>
      <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {[
          {
            icon: FiCheckCircle,
            title: "Nhật ký điều phối sẽ hiện tại đây",
            hint: "Booking, cứu hộ và đơn hàng mới nhất",
          },
          {
            icon: FiClock,
            title: "Chưa có mốc thời gian nào",
            hint: "Kết nối API hoạt động để xem dòng thời gian",
          },
          {
            icon: FiInbox,
            title: "Sẵn sàng theo dõi theo thời gian thực",
            hint: "Tự động làm mới mỗi 30 giây khi có dữ liệu",
          },
        ].map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.title} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {row.title}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {row.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </BentoCard>
  );
}
