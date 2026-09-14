import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký | FlashWrench",
  description:
    "Tạo tài khoản FlashWrench để đặt lịch sửa xe lưu động nhanh chóng.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Tạo tài khoản mới"
      subtitle="Đăng ký miễn phí để đặt thợ lưu động, cứu hộ tận nơi và mua phụ tùng."
      footerText="Đã có tài khoản?"
      footerLinkHref="/login"
      footerLinkLabel="Đăng nhập"
    >
      <RegisterForm />
    </AuthCard>
  );
}
