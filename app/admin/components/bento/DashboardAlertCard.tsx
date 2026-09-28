import { FiAlertCircle, FiCheck, FiLifeBuoy, FiShield } from "react-icons/fi";
import { BentoCard } from "./BentoCard";

type DashboardAlertCardProps = {
  failedConfirmations?: number;
  pendingRescues?: number;
  todayReceipts?: number;
};

// Anti-fraud + ops attention panel: wrong confirmation codes, rescues
// awaiting dispatch and today's receipt count. Badge flips to
// "Cần chú ý" whenever a wrong-code attempt was logged today.
export function DashboardAlertCard({
  failedConfirmations,
  pendingRescues,
  todayReceipts,
}: DashboardAlertCardProps) {
  const hasWarnings =
    failedConfirmations !== undefined && failedConfirmations > 0;
  const tiles = [
    {
      icon: FiShield,
      title: "Sai mã xác nhận",
      value: failedConfirmations,
      hint: "Lần nhập sai mã thu tiền mặt hôm nay",
    },
    {
      icon: FiLifeBuoy,
      title: "Cứu hộ chờ điều phối",
      value: pendingRescues,
      hint: "Yêu cầu mới chưa có thợ nhận",
    },
    {
      icon: FiCheck,
      title: "Phiếu thu hôm nay",
      value: todayReceipts,
      hint: "Giao dịch đã ghi nhận thành công",
    },
  ];
  return (
    <BentoCard label="Cảnh báo hệ thống" className="sm:col-span-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
        </span>
        Cảnh báo vận hành
        <span className="ml-auto rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          {hasWarnings ? "Cần chú ý" : "Ổn định"}
        </span>
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tiles.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900"
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {item.title}
                <span className="ml-auto text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {item.value ?? "—"}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {item.hint}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Mọi lần nhập sai mã xác nhận của thợ đều được ghi vào nhật ký kiểm toán.
      </p>
    </BentoCard>
  );
}
