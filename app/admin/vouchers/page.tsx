import type { Metadata } from "next";
import { AdminVoucherBoard } from "../components/vouchers/AdminVoucherBoard";

export const metadata: Metadata = {
  title: "Ưu đãi voucher",
  description: "Quản lý chiến dịch ví voucher gắn tài khoản.",
};

export default function AdminVouchersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Ưu đãi voucher
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Chỉ admin tạo và bật tắt. Điều phối phát trong hạn mức, mọi thay đổi
          tự cập nhật qua websocket.
        </p>
      </header>
      <AdminVoucherBoard />
    </div>
  );
}
