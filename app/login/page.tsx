import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormAlert } from "@/components/auth/FormAlert";
import { LoginForm } from "@/components/auth/LoginForm";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import {
  accountBlockNotice,
  isAccountLockedParam,
} from "@/lib/auth/account-status";
import {
  buildRegisterHref,
  defaultPostAuthHref,
  getSafeNextPath,
} from "@/lib/auth/auth-redirect";
import { getServerAccountSession } from "@/lib/auth/server-session";
import { listAuthServices } from "@/lib/home/home-catalog.service";

export const metadata: Metadata = {
  title: "Đăng nhập | FlashWrench",
  description: "Đăng nhập tài khoản FlashWrench để đặt lịch sửa xe lưu động.",
};

// `?locked=1` arrives from AccountLockGuard: the account was forced out
// mid-session, so the page it lands on explains why. The toast and the
// overlay are gone by then, this notice is not.
// `?next=` preserves a booking intent from /services: after a successful
// login the form returns there instead of dropping the user on the
// homepage. Already logged-in visits bounce straight to that target so a
// second booking tap never shows the login form again.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string; next?: string }>;
}) {
  const { locked, next } = await searchParams;
  const forceLoggedOut = isAccountLockedParam(locked);
  const safeNext = getSafeNextPath(next);

  if (!forceLoggedOut) {
    const session = await getServerAccountSession();
    if (session.user) {
      redirect(safeNext ?? defaultPostAuthHref(session.user.role));
    }
  }

  const services = await listAuthServices();

  return (
    <AuthCard
      services={services}
      eyebrow="Đăng nhập"
      title="Chào mừng bạn quay lại."
      subtitle="Theo dõi lịch sửa, đơn hàng và voucher trong một tài khoản."
      footerText="Chưa có tài khoản?"
      footerLinkHref={buildRegisterHref(safeNext)}
      footerLinkLabel="Tạo tài khoản"
      perks={["Voucher tự phát khi đủ điều kiện", "Lưu lịch sử sửa xe"]}
    >
      <div className="flex flex-col gap-4">
        {forceLoggedOut ? (
          <FormAlert message={accountBlockNotice("locked").login} />
        ) : null}
        <LoginForm next={safeNext} />
      </div>
      <SpeculationRules scope="login" />
    </AuthCard>
  );
}
