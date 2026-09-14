type BigTypeHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  level?: 1 | 2;
};

// Centered big typography statement: huge tight title plus short
// subtitle. Static Tailwind only; reveal comes from `data-reveal`
// handled by the parent `useBentoReveal` scope.
export function BigTypeHeader({
  eyebrow,
  title,
  subtitle,
  level = 2,
}: BigTypeHeaderProps) {
  const TitleTag = level === 1 ? "h1" : "h2";

  return (
    <div data-reveal className="mx-auto w-full max-w-3xl text-center">
      <p className="flex justify-center">
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400">
          {eyebrow}
        </span>
      </p>
      <TitleTag className="mt-4 text-4xl font-bold tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
        {title}
      </TitleTag>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-sm text-balance text-zinc-600 sm:text-base dark:text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
