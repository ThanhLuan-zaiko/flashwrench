import Link from "next/link";
import type { ReactNode } from "react";
import { FiChevronLeft } from "react-icons/fi";

type TaskBarProps = {
  title: string;
  backHref?: string;
  trailing?: ReactNode;
};

// Phone-only navy bar for flow screens (booking, checkout, tracking). The
// site header hides itself below sm on these routes (usesTaskBar), so this
// bar carries the back link and the task name instead.
export function TaskBar({ title, backHref, trailing }: TaskBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-[#1E3A5F] text-white sm:hidden">
      <div className="flex h-12 items-center gap-1 px-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Quay lại"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        ) : (
          <span aria-hidden="true" className="w-2" />
        )}
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{title}</p>
        {trailing && (
          <div className="shrink-0 pr-2 text-[11px] font-semibold text-zinc-300">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
