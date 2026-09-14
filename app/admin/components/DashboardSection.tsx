import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiLifeBuoy,
  FiTool,
  FiTrendingUp,
} from "react-icons/fi";

const STATS = [
  {
    label: "Lịch đặt hôm nay",
    hint: "Bao gồm mọi trạng thái",
    icon: FiCalendar,
  },
  {
    label: "Cứu hộ đang mở",
    hint: "Chờ điều phối và đang xử lý",
    icon: FiLifeBuoy,
  },
  {
    label: "Thợ đang trực tuyến",
    hint: "Sẵn sàng nhận việc",
    icon: FiTool,
  },
  {
    label: "Doanh thu tháng này",
    hint: "Tổng đơn đã thanh toán (VND)",
    icon: FiTrendingUp,
  },
];

export function DashboardSection() {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Chỉ số vận hành">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <dt className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {stat.label}
                </dt>
                <dd className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  —
                </dd>
                <dd className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {stat.hint}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Số liệu sẽ hiển thị khi API thống kê vận hành được kết nối.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section
          aria-label="Hoạt động gần đây"
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <FiActivity aria-hidden="true" className="h-4 w-4" />
            Hoạt động gần đây
          </h2>
          <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Chưa có hoạt động nào để hiển thị.
          </p>
        </section>

        <section
          aria-label="Cảnh báo hệ thống"
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
            Cảnh báo hệ thống
          </h2>
          <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Hệ thống đang hoạt động ổn định, không có cảnh báo mới.
          </p>
        </section>
      </div>
    </div>
  );
}
