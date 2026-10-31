import Link from "next/link";
import type { ReactNode } from "react";
import { FiCheck } from "react-icons/fi";
import { BRAND_OUTLINE_BUTTON } from "@/components/ui/brand";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { AuthServiceSlideshow } from "./AuthServiceSlideshow";

type AuthSplitCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  eyebrow?: string;
  perks?: string[];
  services: ServiceItem[];
};

// Auth shell with service photos. Phones and tablets: photo band on top,
// a rounded white sheet overlapping it holds the form. From lg: a 50/50
// split that fills the space under the header (the layout's flex-1 slot),
// where the form sheet slides 4rem over the photo with a rounded edge, like
// the phone sheet, so the photo always reaches the bottom edge.
export function AuthSplitCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  eyebrow,
  perks,
  services,
}: AuthSplitCardProps) {
  return (
        <main className="flex flex-1 flex-col bg-[#1E3A5F] sm:bg-white lg:grid lg:min-h-[calc(100svh-65px)] lg:grid-cols-2 dark:sm:bg-zinc-950">
      <AuthServiceSlideshow
        services={services}
        className="h-64 shrink-0 sm:h-60 lg:h-auto"
      />
      <section
        aria-label={title}
        className="relative z-10 -mt-7 flex flex-1 flex-col rounded-t-[28px] bg-white px-5 pt-6 pb-8 sm:px-8 sm:pt-10 lg:-ml-16 lg:mt-0 lg:justify-center lg:rounded-l-[40px] lg:rounded-tr-none lg:py-8 lg:pr-12 lg:pl-28 dark:bg-zinc-950"
      >
        <div className="mx-auto flex w-full max-w-md flex-col lg:max-w-[440px]">
          {eyebrow && (
            <p className="text-[11px] font-bold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1.5 text-[26px] leading-[1.12] font-extrabold tracking-tight text-zinc-900 sm:text-3xl lg:text-[32px] dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 sm:text-[15px] dark:text-zinc-400">
            {subtitle}
          </p>
          <div className="mt-5 lg:mt-7">{children}</div>
          <div className="mt-5 flex flex-col gap-2 border-t border-zinc-200 pt-5 text-center lg:mt-6 lg:gap-2.5 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {footerText}
            </p>
            <Link href={footerLinkHref} className={BRAND_OUTLINE_BUTTON}>
              {footerLinkLabel}
            </Link>
          </div>
          {perks && perks.length > 0 && (
            <ul className="mt-5 hidden justify-center gap-5 text-xs text-zinc-600 lg:flex dark:text-zinc-400">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-1.5">
                  <FiCheck aria-hidden="true" className="h-3 w-3" />
                  {perk}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
