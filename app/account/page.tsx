import type { Metadata } from "next";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { AvatarSection } from "@/components/media/AvatarSection";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { BackLink } from "@/components/ui/BackLink";
import { PageIntro } from "@/components/ui/PageIntro";

export const metadata: Metadata = {
  title: "Tài khoản | FlashWrench",
  description: "Quản lý tài khoản và các thiết bị đang đăng nhập FlashWrench.",
};

// Account screen: the same header chapter as the other customer pages, then the
// avatar and the account panel as ruled sections.
export default function AccountPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 pt-8 pb-16 sm:px-6 lg:px-10">
      <BackLink href="/" label="Về trang chủ" />
      <div className="mt-6 flex flex-col gap-8">
        <PageIntro
          eyebrow="Tài khoản"
          lines={["Tài khoản của tôi."]}
          subtitle="Xem thông tin tài khoản, thu hồi từng thiết bị hoặc đăng xuất khỏi tất cả thiết bị khi nghi ngờ bị đánh cắp phiên đăng nhập."
        />
        <AvatarSection />
        <AccountPanel />
      </div>
      <SpeculationRules scope="account" />
    </main>
  );
}
