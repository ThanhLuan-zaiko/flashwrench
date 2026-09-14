import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft, FiKey, FiShield } from "react-icons/fi";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Đổi mật khẩu | FlashWrench",
  description: "Đổi mật khẩu tài khoản FlashWrench.",
};

const TIPS = [
  {
    id: "strong",
    title: "Mật khẩu mạnh",
    hint: "Ít nhất 8 ký tự, gồm cả chữ cái và chữ số.",
    icon: FiKey,
  },
  {
    id: "sessions",
    title: "Tự động bảo vệ",
    hint: "Mọi thiết bị khác sẽ bị đăng xuất ngay sau khi đổi.",
    icon: FiShield,
  },
];

// Server bento split: security panel plus form plus wide tips.
// Static render on purpose (metadata page), same visual language.
export default function ChangePasswordPage() {
  return (
    <main className="flex flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-6 sm:px-6 md:gap-4 md:py-10">
        <Link
          href="/account"
          className="inline-flex min-h-[44px] items-center gap-1.5 self-start text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 motion-safe:active:scale-[0.98] dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          Về tài khoản
        </Link>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          <AuthBrandPanel
            title="Bảo mật trước hết."
            description="Mật khẩu mạnh giữ an toàn cho xe, lịch đặt và phiên đăng nhập của bạn."
            items={[
              {
                icon: FiKey,
                title: "Ít nhất 8 ký tự",
                hint: "Gồm chữ cái và chữ số, khó đoán.",
              },
              {
                icon: FiShield,
                title: "Đổi là đăng xuất",
                hint: "Mọi thiết bị khác bị đăng xuất ngay.",
              },
            ]}
          />

          <section
            aria-label="Đổi mật khẩu"
            className="rounded-2xl border border-zinc-200 bg-white p-6 sm:col-span-2 sm:p-8 lg:col-span-2 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Đổi mật khẩu
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sau khi đổi, mọi thiết bị khác sẽ bị đăng xuất ngay lập tức.
            </p>
            <div className="mt-6">
              <ChangePasswordForm />
            </div>
          </section>

          {TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-1 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {tip.title}
                  </span>
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {tip.hint}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
