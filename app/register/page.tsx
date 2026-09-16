import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  buildLoginHref,
  defaultPostAuthHref,
  getSafeNextPath,
} from "@/lib/auth/auth-redirect";
import { getServerAccountSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Đăng ký | FlashWrench",
  description:
    "Tạo tài khoản FlashWrench để đặt lịch sửa xe lưu động nhanh chóng.",
};

// `?next=` preserves a booking intent from /services: after a successful
// signup the form returns there instead of dropping the user on the
// homepage. Already logged-in visits bounce straight to that target so a
// second booking tap never shows the register form again.
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = getSafeNextPath(next);

  const session = await getServerAccountSession();
  if (session.user) {
    redirect(safeNext ?? defaultPostAuthHref(session.user.role));
  }

  return (
    <AuthCard
      title="Tạo tài khoản mới"
      subtitle="Đăng ký miễn phí để đặt thợ lưu động, cứu hộ tận nơi và mua phụ tùng."
      footerText="Đã có tài khoản?"
      footerLinkHref={buildLoginHref(safeNext)}
      footerLinkLabel="Đăng nhập"
    >
      <RegisterForm next={safeNext} />
    </AuthCard>
  );
}
