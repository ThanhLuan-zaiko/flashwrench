type SchedulePagerProps = {
  page: number;
  pageCount: number;
  range: { start: number; end: number };
  total: number;
  onPage: (page: number) => void;
};

// Numbered pager for the work queue, clamped and reset on filter change by
// the parent. Buttons keep the 44px minimum touch target.
export function SchedulePager({
  page,
  pageCount,
  range,
  total,
  onPage,
}: SchedulePagerProps) {
  const pages = Array.from({ length: pageCount }, (_, index) => index);
  return (
    <nav
      aria-label="Phân trang đơn hàng"
      className="flex flex-wrap items-center justify-between gap-2 pt-3"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Hiển thị {range.start}–{range.end} trên {total} đơn
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {pages.map((index) => (
          <button
            key={index}
            type="button"
            disabled={index === page}
            onClick={() => onPage(index)}
            aria-label={`Trang ${index + 1}`}
            aria-current={index === page ? "page" : undefined}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] ${
              index === page
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </nav>
  );
}
