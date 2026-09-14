import { FiUsers } from "react-icons/fi";
import { BentoCard } from "./BentoCard";
import { USER_TABS, type UserTabId } from "./users-tabs";

type UsersHeroCardProps = {
  active: UserTabId;
  onChange: (tab: UserTabId) => void;
};

// Hero 2x2 card: title plus large tab targets for user workflows.
export function UsersHeroCard({ active, onChange }: UsersHeroCardProps) {
  const current = USER_TABS.find((t) => t.id === active) ?? USER_TABS[0];

  return (
    <BentoCard
      label="Quản lý người dùng"
      className="flex flex-col sm:col-span-2 lg:row-span-2"
    >
      <p className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <FiUsers aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Quản lý người dùng
        </span>
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance text-zinc-900 md:text-3xl dark:text-zinc-50">
        Duyệt thợ, khóa tài khoản
      </h2>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        {current.hint}. Chọn nhóm chức năng bên dưới để xử lý nhanh.
      </p>

      <div
        role="tablist"
        aria-label="Nhóm chức năng quản lý người dùng"
        className="mt-4 flex flex-col gap-2"
      >
        {USER_TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span
                  className={`block truncate text-xs ${
                    selected
                      ? "text-zinc-300 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </BentoCard>
  );
}
