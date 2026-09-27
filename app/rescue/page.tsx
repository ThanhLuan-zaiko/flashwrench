import type { Metadata } from "next";
import { RescueEntry } from "@/components/rescue/RescueEntry";

export const metadata: Metadata = {
  title: "Cứu hộ khẩn cấp | FlashWrench",
  description:
    "Gửi yêu cầu cứu hộ xe 24/7 không cần đăng nhập. Điền tên, số điện thoại và vị trí xe, thợ trực gọi lại ngay.",
};

// Public rescue page: guests file without an account, so no session
// check and no login redirect here. The entry collects contact info
// on every submit instead.
export default function RescuePage() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14 xl:max-w-7xl">
        <RescueEntry />
      </div>
    </main>
  );
}
