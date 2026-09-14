import { FiAlertCircle, FiCheck } from "react-icons/fi";
import { BentoCard } from "./BentoCard";

// Wide system health card. Hierarchy comes from borders and
// typography only, no accent hues per monochrome rule.
export function DashboardAlertCard() {
  return (
    <BentoCard label="Cảnh báo hệ thống" className="sm:col-span-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
        </span>
        Cảnh báo hệ thống
        <span className="ml-auto rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          Ổn định
        </span>
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          { title: "API đặt lịch", hint: "Phản hồi bình thường" },
          { title: "Cơ sở dữ liệu", hint: "Đồng bộ đầy đủ" },
          { title: "Xác thực", hint: "Không có lỗi mới" },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <FiCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {item.hint}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Không có cảnh báo mới. Hệ thống kiểm tra tự động mỗi 5 phút.
      </p>
    </BentoCard>
  );
}
