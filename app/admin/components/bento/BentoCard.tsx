import type { ReactNode } from "react";

type BentoCardProps = {
  children: ReactNode;
  className?: string;
  label?: string;
  interactive?: boolean;
};

// Shared bento surface: uniform radius, border, palette.
// Motion is handled by `data-reveal` + useBentoReveal, hover lift is
// Tailwind-only and scoped behind motion-safe.
export function BentoCard({
  children,
  className = "",
  label,
  interactive = false,
}: BentoCardProps) {
  return (
    <section
      aria-label={label}
      data-reveal
      className={`rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${
        interactive
          ? "motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]"
          : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}
