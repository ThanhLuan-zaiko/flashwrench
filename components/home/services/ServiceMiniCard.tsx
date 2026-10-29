import type { IconType } from "react-icons";

type ServiceMiniCardProps = {
  title: string;
  hint: string;
  icon: IconType;
};

// Compact 1x1 service cell for the services bento grid. The icon tile
// carries a faint navy tint so the cells read as one brand family.
export function ServiceMiniCard({ title, hint, icon }: ServiceMiniCardProps) {
  const Icon = icon;
  return (
    <section
      aria-label={title}
      data-reveal
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors duration-200 hover:border-[#1E3A5F]/40 md:p-5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-white/10 dark:text-zinc-100">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
    </section>
  );
}
