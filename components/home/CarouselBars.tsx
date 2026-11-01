type CarouselBarsProps = {
  keys: string[];
  current: number;
  itemLabel: string;
  onSelect: (index: number) => void;
};

// Thin progress bars under a carousel. The active one is dark; each bar is a
// 44px touch target and jumps the carousel straight to its slide. `keys` holds
// one stable id per slide.
export function CarouselBars({
  keys,
  current,
  itemLabel,
  onSelect,
}: CarouselBarsProps) {
  return (
    <div className="flex gap-1">
      {keys.map((key, position) => (
        <button
          key={key}
          type="button"
          aria-label={`${itemLabel} ${position + 1} trên ${keys.length}`}
          aria-current={position === current}
          onClick={() => onSelect(position)}
          className="flex min-h-11 flex-1 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <span
            className={`block h-0.5 w-full ${position === current ? "bg-[#1E3A5F] dark:bg-zinc-50" : "bg-zinc-300 dark:bg-zinc-700"}`}
          />
        </button>
      ))}
    </div>
  );
}
