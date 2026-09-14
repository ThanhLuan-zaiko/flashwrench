import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowLeft } from "react-icons/fi";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
};

export function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 sm:px-6 dark:bg-black">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          Về trang chủ
        </Link>

        <section
          aria-labelledby="auth-title"
          className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h1
            id="auth-title"
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>

          <div className="mt-6">{children}</div>

          <p className="mt-6 border-t border-zinc-200 pt-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-semibold text-zinc-900 underline-offset-4 transition-colors duration-200 hover:underline dark:text-zinc-50"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
