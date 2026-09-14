import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { AccountPanel } from "@/components/auth/AccountPanel";

export const metadata: Metadata = {
  title: "Tài khoản | FlashWrench",
  description: "Quản lý tài khoản và các thiết bị đang đăng nhập FlashWrench.",
};

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
        Về trang chủ
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Tài khoản của tôi
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Xem thông tin tài khoản, thu hồi từng thiết bị hoặc đăng xuất khỏi tất
        cả thiết bị khi nghi ngờ bị đánh cắp phiên đăng nhập.
      </p>
      <div className="mt-6">
        <AccountPanel />
      </div>
    </main>
  );
}
