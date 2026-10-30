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
  // Extra layout classes, e.g. hiding the panel on phones.
  className?: string;
};

// Hero panel for auth bento grids. Standard skill surface; emphasis
// comes from giant type size, not inverted color. Checklist
// collapses on mobile to keep the form one scroll away.
export function AuthBrandPanel({
  title = "Sửa xe tận nơi.",
  description = "Đặt thợ lưu động, cứu hộ khẩn cấp và theo dõi tiến độ trong một ứng dụng duy nhất.",
  items = DEFAULT_ITEMS,
  className = "",
}: AuthBrandPanelProps) {
  return (
    <div
      data-reveal
      className={`flex flex-col justify-between gap-6 rounded-2xl bg-[#1E3A5F] p-6 text-white sm:col-span-2 sm:p-8 lg:col-span-2 lg:row-span-2 ${className}`}
    >
      <div>
        <p>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#1E3A5F]">
            FW
          </span>
        </p>
        <p className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-white sm:text-5xl">
          {title}
        </p>
        <p className="mt-3 max-w-md text-sm text-zinc-200 sm:text-base">
          {description}
        </p>
      </div>
      <ul className="hidden flex-col gap-2 sm:flex">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="flex items-center gap-3 rounded-xl bg-white/10 p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {item.title}
                </span>
                <span className="block truncate text-xs text-zinc-300">
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
