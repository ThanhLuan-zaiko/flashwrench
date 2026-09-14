import type { IconType } from "react-icons";
import { FiCheck } from "react-icons/fi";

export type BrandPanelItem = {
  icon: IconType;
  title: string;
  hint: string;
};

const DEFAULT_ITEMS: BrandPanelItem[] = [
  {
    icon: FiCheck,
    title: "Thợ đã xác thực",
    hint: "Hồ sơ kiểm duyệt bởi quản trị viên.",
  },
  {
    icon: FiCheck,
    title: "Giá minh bạch",
    hint: "Bảng giá rõ ràng trước khi xác nhận.",
  },
  {
    icon: FiCheck,
    title: "Cứu hộ 24/7",
    hint: "Có mặt tận nơi khi bạn cần nhất.",
  },
];

type AuthBrandPanelProps = {
  title?: string;
  description?: string;
  items?: BrandPanelItem[];
};

// Hero panel for auth bento grids. Standard skill surface; emphasis
// comes from giant type size, not inverted color. Checklist
// collapses on mobile to keep the form one scroll away.
export function AuthBrandPanel({
  title = "Sửa xe tận nơi.",
  description = "Đặt thợ lưu động, cứu hộ khẩn cấp và theo dõi tiến độ trong một ứng dụng duy nhất.",
  items = DEFAULT_ITEMS,
}: AuthBrandPanelProps) {
  return (
    <div
      data-reveal
      className="flex flex-col justify-between gap-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:col-span-2 sm:p-8 lg:col-span-2 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <p>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
            FW
          </span>
        </p>
        <p className="mt-5 text-4xl font-bold tracking-tight text-balance text-zinc-900 sm:text-5xl dark:text-zinc-50">
          {title}
        </p>
        <p className="mt-3 max-w-md text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
          {description}
        </p>
      </div>
      <ul className="hidden flex-col gap-2 sm:flex">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {item.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
