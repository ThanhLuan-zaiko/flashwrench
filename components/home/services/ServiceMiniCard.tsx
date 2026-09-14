import type { IconType } from "react-icons";

type ServiceMiniCardProps = {
  title: string;
  hint: string;
  icon: IconType;
};

// Compact 1x1 service cell for the services bento grid.
export function ServiceMiniCard({ title, hint, icon }: ServiceMiniCardProps) {
  const Icon = icon;
  return (
    <section
      aria-label={title}
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
    </section>
  );
}
