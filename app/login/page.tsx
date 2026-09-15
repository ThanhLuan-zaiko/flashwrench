import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormAlert } from "@/components/auth/FormAlert";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  accountBlockNotice,
  isAccountLockedParam,
} from "@/lib/auth/account-status";

export const metadata: Metadata = {
  title: "Đăng nhập | FlashWrench",
  description: "Đăng nhập tài khoản FlashWrench để đặt lịch sửa xe lưu động.",
};

// `?locked=1` arrives from AccountLockGuard: the account was forced out
// mid-session, so the page it lands on explains why. The toast and the
// overlay are gone by then, this notice is not.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const { locked } = await searchParams;
  const forceLoggedOut = isAccountLockedParam(locked);

  return (
    <AuthCard
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để đặt lịch sửa xe, theo dõi tiến độ và quản lý xe của bạn."
      footerText="Chưa có tài khoản?"
      footerLinkHref="/register"
      footerLinkLabel="Đăng ký ngay"
    >
      <div className="flex flex-col gap-4">
        {forceLoggedOut ? (
          <FormAlert message={accountBlockNotice("locked").login} />
        ) : null}
        <LoginForm />
      </div>
    </AuthCard>
  );
}
