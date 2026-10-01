import type { ReactNode } from "react";
import { WalletBoard } from "@/components/vouchers/WalletBoard";

// Shared shell for /vouchers and /vouchers/page/N. Next.js keeps the
// layout mounted while only the page segment changes, so pager links
// reuse the wallet query cache instead of remounting the board.
export default function VouchersLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Ví voucher của tôi
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Mỗi voucher chỉ dùng được trên tài khoản này, tự cập nhật khi có
          voucher mới.
        </p>
      </header>
      <WalletBoard />
      {children}
    </main>
  );
}
