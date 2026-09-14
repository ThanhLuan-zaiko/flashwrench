import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Đổi mật khẩu | FlashWrench",
  description: "Đổi mật khẩu tài khoản FlashWrench.",
};

export default function ChangePasswordPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
        Về tài khoản
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Đổi mật khẩu
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Sau khi đổi, mọi thiết bị khác sẽ bị đăng xuất ngay lập tức.
      </p>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
