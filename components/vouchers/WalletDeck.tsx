import Link from "next/link";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import {
  formatPromoVnd,
  promoExpiryLabel,
  promoScopeLabel,
} from "../promotions/promo-format";
import { walletDetailHref } from "./voucher-detail-href";

function deckDiscountLabel(wallet: VoucherWallet): string {
  if (wallet.discountType === "percent") return `-${wallet.discountValue}%`;
  if (wallet.discountType === "free_service") return "Miễn phí công";
  return `-${formatPromoVnd(wallet.discountValue)}`;
}

// Stacked offsets per visible-card count. Rest: each card peeks 28px
// below the one above. Fanned (hover / keyboard focus): tops spread
// evenly through the 224px well so every card face shows ~43-64px.
// Tailwind only emits literal class names, so the full strings live
// here — no runtime class composition.
const STACK_CLASSES: Record<number, readonly string[]> = {
  2: [
    "z-40 translate-y-0",
    "z-30 translate-y-7 group-hover:translate-y-32 group-focus-within:translate-y-32",
  ],
  3: [
    "z-40 translate-y-0",
    "z-30 translate-y-7 group-hover:translate-y-16 group-focus-within:translate-y-16",
    "z-20 translate-y-14 group-hover:translate-y-32 group-focus-within:translate-y-32",
  ],
  4: [
    "z-40 translate-y-0",
    "z-30 translate-y-7 group-hover:translate-y-[43px] group-focus-within:translate-y-[43px]",
    "z-20 translate-y-14 group-hover:translate-y-[86px] group-focus-within:translate-y-[86px]",
    "z-10 translate-y-[84px] group-hover:translate-y-32 group-focus-within:translate-y-32",
  ],
};

const DECK_CARD_BASE =
  "absolute inset-x-0 top-0 flex h-24 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3 transition-transform duration-300 ease-out motion-reduce:transition-none hover:z-50 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950";

// The owner's other usable vouchers as one Apple-Wallet-style deck —
// resting as a peeked stack, fanning open on hover/focus, each card a
// straight link to its wallet detail (one tap on touch devices).
export function WalletDeck({
  wallets,
  overflow,
}: {
  wallets: VoucherWallet[];
  overflow: number;
}) {
  const count = Math.min(wallets.length, 4);
  const offsets = STACK_CLASSES[count] ?? STACK_CLASSES[4];
  const total = wallets.length + overflow;
  return (
    <div
      data-reveal
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 p-3 sm:col-span-2 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative h-56">
        {wallets.slice(0, 4).map((wallet, index) => (
          <Link
            key={wallet.id}
            href={walletDetailHref(wallet.id)}
            scroll={false}
            prefetch
            aria-label={`Mở voucher ${wallet.campaignName}`}
            className={`${DECK_CARD_BASE} ${offsets[index]}`}
          >
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {deckDiscountLabel(wallet)}
              </span>
              <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {wallet.campaignName}
              </span>
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {promoScopeLabel(wallet.scope)} ·{" "}
              {promoExpiryLabel({ endAt: wallet.expiresAt })}
            </p>
          </Link>
        ))}
        <p className="pointer-events-none absolute bottom-0 left-1 z-0 text-[11px] text-zinc-500 dark:text-zinc-400">
          {total} voucher khác · chạm để mở
        </p>
      </div>
      {overflow > 0 ? (
        <p className="pointer-events-none absolute right-3 bottom-3 z-50 rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-white dark:text-zinc-900">
          +{overflow} nữa
        </p>
      ) : null}
    </div>
  );
}
