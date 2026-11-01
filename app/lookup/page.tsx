import type { Metadata } from "next";
import { GuestLookupScreen } from "@/components/guest-access/GuestLookupScreen";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { PageIntro } from "@/components/ui/PageIntro";

export const metadata: Metadata = {
  title: "Tra cứu dịch vụ | FlashWrench",
  description:
    "Xem lại lịch sử sửa xe, cứu hộ, đơn linh kiện và hóa đơn bằng mã xác minh qua email, không cần tạo tài khoản.",
  robots: { index: false, follow: false },
};

// Public lookup for customers who booked without an account. The page is a
// thin server shell; the flow itself is one client screen because the OTP
// round-trip is a single continuous surface, not a set of URL tabs.
export default function GuestLookupPage() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="w-full px-4 pt-8 pb-16 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <PageIntro
            eyebrow="Tra cứu"
            lines={["Tra cứu dịch vụ đã dùng."]}
            subtitle="Bạn đã đặt lịch hoặc mua linh kiện mà không tạo tài khoản? Nhập email đã dùng để xem lại lịch sử, theo dõi thợ trên bản đồ và tải hóa đơn."
          />
          <GuestLookupScreen />
        </div>
      </div>
      <SpeculationRules scope="lookup" />
    </main>
  );
}
