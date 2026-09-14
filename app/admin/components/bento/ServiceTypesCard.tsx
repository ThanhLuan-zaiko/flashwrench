import { FiLayers } from "react-icons/fi";
import { BentoCard } from "./BentoCard";
import { SERVICE_GROUPS } from "./service-groups";

// Wide card listing repairable categories with status pills.
export function ServiceTypesCard() {
  return (
    <BentoCard label="Loại hình sửa chữa" className="sm:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <FiLayers aria-hidden="true" className="h-4 w-4" />
          </span>
          Loại hình sửa chữa
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Bật hoặc tắt từng loại hình cung cấp
        </p>
      </div>
      <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {SERVICE_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <li
              key={group.id}
              className="flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {group.title}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {group.hint}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  Đang áp dụng
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {group.priceHint}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </BentoCard>
  );
}
