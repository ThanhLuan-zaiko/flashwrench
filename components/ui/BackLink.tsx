import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

const LIGHT_CLASSES =
  "flex w-fit min-h-11 items-center gap-1.5 text-sm font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] motion-safe:active:scale-[0.99] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";
const DARK_CLASSES =
  "flex w-fit min-h-11 items-center gap-1.5 text-sm font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] motion-safe:active:scale-[0.99]";

type BackLinkProps = {
  href: string;
  label: string;
  onDark?: boolean;
};

// Back link for detail screens: a bold text link with an arrow, the same
// secondary-action style as the rest of the page. On a navy band it is white.
export function BackLink({ href, label, onDark = false }: BackLinkProps) {
  return (
    <Link href={href} className={onDark ? DARK_CLASSES : LIGHT_CLASSES}>
      <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
      {label}
    </Link>
  );
}
