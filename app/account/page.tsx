import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";

export const metadata: Metadata = {
  title: "Tài khoản | FlashWrench",
  description: "Quản lý tài khoản và các thiết bị đang đăng nhập FlashWrench.",
};

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
        Về trang chủ
      </Link>
      <BigTypeHeader
        level={1}
        eyebrow="FlashWrench · Tài khoản"
        title="Tài khoản của tôi."
        subtitle="Xem thông tin tài khoản, thu hồi từng thiết bị hoặc đăng xuất khỏi tất cả thiết bị khi nghi ngờ bị đánh cắp phiên đăng nhập."
      />
      <div className="mt-8">
        <AccountPanel />
      </div>
    </main>
  );
}
