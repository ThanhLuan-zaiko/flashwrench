import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { LazyAccountLockGuard } from "@/components/auth/LazyAccountLockGuard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";
import { ToastProvider } from "@/components/toast/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlashWrench - Sửa xe lưu động",
  description: "Đặt lịch sửa xe lưu động, cứu hộ tận nơi nhanh chóng",
};

// The lock guard (realtime socket, session polling, overlay) renders null
// for almost every visit, so it stays out of the first paint through the
// lazy client boundary above: Next.js serves it as a separate chunk that
// loads right after hydration instead of blocking the static page shell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeInitScript />
        <QueryProvider>
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
