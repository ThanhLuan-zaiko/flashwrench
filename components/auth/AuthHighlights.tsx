import { FiActivity, FiShield, FiTag, FiZap } from "react-icons/fi";

const HIGHLIGHTS = [
  {
    id: "onsite",
    title: "Thợ tới tận nơi",
    hint: "Đặt lịch lưu động, cứu hộ 24/7.",
    icon: FiZap,
  },
  {
    id: "verified",
    title: "Thợ đã xác thực",
    hint: "Hồ sơ kiểm duyệt bởi quản trị viên.",
    icon: FiShield,
  },
  {
    id: "pricing",
    title: "Giá minh bạch",
    hint: "Bảng giá rõ ràng trước khi xác nhận.",
    icon: FiTag,
  },
  {
    id: "tracking",
    title: "Theo dõi tiến độ",
    hint: "Cập nhật trạng thái theo thời gian thực.",
    icon: FiActivity,
  },
];

// Trust minis for the auth bento grid. Returns bare cards (no grid
// wrapper) so the parent owns the single grid root.
export function AuthHighlights() {
  return (
    <>
      {HIGHLIGHTS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            data-reveal
            className="rounded-2xl border border-zinc-200 bg-white p-4 transition-transform duration-200 motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {item.title}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {item.hint}
            </p>
          </div>
        );
      })}
    </>
  );
}
