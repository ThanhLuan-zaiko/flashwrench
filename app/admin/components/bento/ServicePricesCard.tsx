import { FiDollarSign, FiFileText, FiToggleRight } from "react-icons/fi";
import { BentoCard } from "./BentoCard";

// Wide price catalogue card with structured empty state.
export function ServicePricesCard() {
  return (
    <BentoCard label="Bảng giá dịch vụ" className="sm:col-span-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <FiDollarSign aria-hidden="true" className="h-4 w-4" />
        </span>
        Bảng giá dịch vụ
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2">
        {[
          {
            icon: FiFileText,
            title: "Chưa có mục giá nào",
            hint: "Bảng giá chi tiết sẽ hiện tại đây",
          },
          {
            icon: FiToggleRight,
            title: "Sẵn sàng phân nhóm theo loại hình",
            hint: "Bảo dưỡng · Sửa chữa · Cứu hộ",
          },
        ].map((row) => {
          const Icon = row.icon;
          return (
            <li
              key={row.title}
              className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
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
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Kết nối API danh mục dịch vụ để quản lý giá theo thời gian thực.
      </p>
    </BentoCard>
  );
}
