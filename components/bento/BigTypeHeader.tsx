type BigTypeHeaderProps = {
  // Omitted on staff pages, whose sticky section bar already names the
  // area and section.
  eyebrow?: string;
  title: string;
  subtitle?: string;
  level?: 1 | 2;
};

// Big typography statement: huge tight title plus short subtitle. Static
// Tailwind only; reveal comes from `data-reveal` handled by the parent
// `useBentoReveal` scope.
export function BigTypeHeader({
  eyebrow,
  title,
  subtitle,
  level = 2,
}: BigTypeHeaderProps) {
  const TitleTag = level === 1 ? "h1" : "h2";

  return (
    <div data-reveal className="w-full max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase sm:mb-3 sm:text-xs dark:text-zinc-400">
          {eyebrow}
        </p>
      )}
      <TitleTag className="text-[30px] leading-[1.05] font-extrabold tracking-tight text-balance text-[#1E3A5F] sm:text-5xl lg:text-6xl dark:text-zinc-50">
        {title}
      </TitleTag>
      {subtitle && (
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-pretty text-zinc-600 sm:mt-4 sm:text-base dark:text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
