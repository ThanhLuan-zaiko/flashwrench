import type { Metadata } from "next";
import { WalletBoard } from "@/components/vouchers/WalletBoard";

export const metadata: Metadata = {
  title: "Ví voucher",
  description: "Voucher giảm giá gắn với tài khoản của bạn.",
};

export default function VouchersPage() {
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
    </main>
  );
}
