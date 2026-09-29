import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { LazyAccountLockGuard } from "@/components/auth/LazyAccountLockGuard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { getServerAccountSession } from "@/lib/auth/server-session";
import { baseMetadata } from "@/lib/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Site-wide defaults: metadataBase makes OG/Twitter image URLs absolute,
// which is what messaging apps need to render link previews. Public pages
// override openGraph.title/description; everything else inherits this.
export const metadata: Metadata = baseMetadata();

// The lock guard (realtime socket, session polling, overlay) renders null
// for almost every visit, so it stays out of the first paint through the
// lazy client boundary above: Next.js serves it as a separate chunk that
// loads right after hydration instead of blocking the static page shell.
//
// Async on purpose: reading the session here opts every page into dynamic
// rendering (no more static prerender), so the header paints the true
// login state immediately instead of a spinner plus a client fetch.
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAccountSession();
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased ${SCROLLBAR_CLASSES}`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeInitScript />
        <QueryProvider initialSession={session}>
          <ToastProvider>
            <LazyAccountLockGuard />
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
