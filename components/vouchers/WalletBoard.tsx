"use client";

import { PageBounce } from "@/components/pagination/PageBounce";
import { useMe } from "@/hooks/auth";
import { useCursorRoutePage } from "@/hooks/useCursorRoutePage";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useMyWallets } from "@/hooks/useVouchers";
import { WalletCard } from "./WalletCard";
import { WalletPager } from "./WalletPager";

export function WalletBoard() {
  // The owner inbox (user:{id}) carries grant/use/revoke signals for
  // this account; the public promotions topic covers campaign changes.
  const me = useMe();
  useVoucherRealtime(me.data?.id, false);
  // The page index lives on the URL (/page/N); the pageState chain lives
  // in an in-memory map. Cold loads on N>1 bounce to the list root.
  const { page, cursor, known, recordNext, hrefFor } = useCursorRoutePage();
  const wallets = useMyWallets(known, { cursor });

  if (!known) {
    return <PageBounce />;
  }
  if (wallets.isPending) {
    return (
      <p className="text-sm text-zinc-500 motion-safe:animate-pulse dark:text-zinc-400">
        Đang tải ví voucher…
      </p>
    );
  }
  if (wallets.isError) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Không tải được ví voucher. Vui lòng tải lại trang.
      </p>
    );
  }
  const items = wallets.data?.items ?? [];
  const nextCursor = wallets.data?.nextCursor ?? null;
  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
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
    <section
      id="tat-ca-voucher"
      aria-label="Tất cả voucher của bạn"
      className="flex flex-col gap-3"
    >
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
        Tất cả voucher
      </h2>
      <ul className="flex flex-col divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((wallet) => (
          <li key={wallet.id}>
            <WalletCard wallet={wallet} />
          </li>
        ))}
      </ul>
      <WalletPager
        page={page}
        count={items.length}
        canBack={page > 1}
        canNext={nextCursor !== null}
        loading={wallets.isFetching}
        backHref={hrefFor(page - 1)}
        nextHref={hrefFor(page + 1)}
        onNextClick={() => {
          if (nextCursor) recordNext(nextCursor);
        }}
      />
    </section>
  );
}
