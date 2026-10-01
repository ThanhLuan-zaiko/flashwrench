"use client";

import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useMyWallets } from "@/hooks/useVouchers";
import { WalletCard } from "./WalletCard";

export function WalletBoard({ ownerId }: { ownerId?: string }) {
  useVoucherRealtime(ownerId, false);
  const wallets = useMyWallets(true);

  if (wallets.isPending) {
    return (
      <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 motion-safe:animate-pulse dark:border-zinc-800 dark:text-zinc-400">
        Đang tải ví voucher…
      </p>
    );
  }
  if (wallets.isError) {
    return (
      <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
        Không tải được ví voucher. Vui lòng đăng nhập rồi thử lại.
      </p>
    );
  }
  const items = wallets.data ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
          Chưa có voucher nào
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Tạo tài khoản và mua hàng để nhận voucher sửa xe dành riêng cho bạn.
        </p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {items.map((wallet) => (
        <li key={wallet.id}>
          <WalletCard wallet={wallet} />
        </li>
      ))}
    </ul>
  );
}
