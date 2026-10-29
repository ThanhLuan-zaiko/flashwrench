import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { LazyAccountLockGuard } from "@/components/auth/LazyAccountLockGuard";
import { LazyChatFab } from "@/components/chat/LazyChatFab";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LazyPaymentPromptBanner } from "@/components/payments/LazyPaymentPromptBanner";
import { LazyCrossTabSync } from "@/components/providers/LazyCrossTabSync";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { getServerAccountSession } from "@/lib/auth/server-session";
import { baseMetadata } from "@/lib/seo/site";
import "./globals.css";

// Site-wide brand face (first shipped on the homepage). The Vietnamese
// subset covers the full diacritics used across the UI copy.
const brandFont = Be_Vietnam_Pro({
  variable: "--font-brand",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${brandFont.variable} h-full antialiased ${SCROLLBAR_CLASSES}`}
    >
      <body className="flex min-h-full flex-col bg-white font-[family-name:var(--font-brand)] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeInitScript />
        <QueryProvider initialSession={session}>
          <ToastProvider>
            <LazyCrossTabSync />
            <LazyAccountLockGuard />
            <LazyChatFab />
            <SiteHeader />
            <LazyPaymentPromptBanner />
            <div className="flex flex-1 flex-col">{children}</div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
