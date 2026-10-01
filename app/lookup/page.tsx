import type { Metadata } from "next";
import { GuestLookupScreen } from "@/components/guest-access/GuestLookupScreen";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";

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
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 md:py-14">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Tra cứu dịch vụ
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Bạn đã đặt lịch hoặc mua linh kiện mà không tạo tài khoản? Nhập
            email đã dùng để xem lại lịch sử, theo dõi thợ trên bản đồ và tải
            hóa đơn.
          </p>
        </header>
        <GuestLookupScreen />
      </div>
      <SpeculationRules scope="lookup" />
    </main>
  );
}
