import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

const LIGHT_CLASSES =
  "flex w-fit min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";
const DARK_CLASSES =
  "flex w-fit min-h-[44px] items-center gap-1.5 rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-safe:active:scale-[0.99]";

type BackLinkProps = {
  href: string;
  label: string;
  onDark?: boolean;
};

// Back link for detail screens. On a navy band it is a white ghost button, so
// the band can start right under the site header.
export function BackLink({ href, label, onDark = false }: BackLinkProps) {
  return (
    <Link href={href} className={onDark ? DARK_CLASSES : LIGHT_CLASSES}>
      <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
      {label}
    </Link>
  );
}
