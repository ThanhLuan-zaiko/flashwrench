import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | FlashWrench",
  description: "Đăng nhập tài khoản FlashWrench để đặt lịch sửa xe lưu động.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để đặt lịch sửa xe, theo dõi tiến độ và quản lý xe của bạn."
      footerText="Chưa có tài khoản?"
      footerLinkHref="/register"
      footerLinkLabel="Đăng ký ngay"
    >
      <LoginForm />
    </AuthCard>
  );
}
