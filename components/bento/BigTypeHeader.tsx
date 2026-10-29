type BigTypeHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  level?: 1 | 2;
  // "brand" (customer screens): left-aligned navy headline in the
  // homepage style. "mono" (staff portals): the centered monochrome look.
  tone?: "brand" | "mono";
};

// Big typography statement: huge tight title plus short subtitle. Static
// Tailwind only; reveal comes from `data-reveal` handled by the parent
// `useBentoReveal` scope.
export function BigTypeHeader({
  eyebrow,
  title,
  subtitle,
  level = 2,
  tone = "brand",
}: BigTypeHeaderProps) {
  const TitleTag = level === 1 ? "h1" : "h2";

  if (tone === "brand") {
    return (
      <div data-reveal className="w-full max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400">
          {eyebrow}
        </p>
        <TitleTag className="mt-3 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-[#1E3A5F] sm:text-5xl lg:text-6xl dark:text-zinc-50">
          {title}
        </TitleTag>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

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
