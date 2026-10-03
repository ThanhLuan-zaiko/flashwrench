import { FiArrowDown, FiArrowRight, FiPercent, FiTag } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { formatPromoVnd } from "../promotions/promo-format";
import { WalletDeck } from "./WalletDeck";
import { WalletHeroTicket } from "./WalletHeroTicket";
import { WalletMiniTile } from "./WalletMiniTile";
import { WalletStatTile } from "./WalletStatTile";

const countFormat = (value: number): string =>
  new Intl.NumberFormat("vi-VN").format(value);

function voucherFaceValue(wallet: VoucherWallet): number {
  if (wallet.discountType === "fixed") return wallet.discountValue;
  if (wallet.discountType === "percent") return wallet.maxDiscount;
  return 0;
}

// The owner's wallet as one bento block: the best usable voucher leads
// as a ticket, stat tiles carry the counts, and any other active
// vouchers get 1x1 mini tiles. Used/expired vouchers stay in the paged
// archive list below.
export function WalletBento({
  wallets,
  remainingOffers,
}: {
  wallets: VoucherWallet[];
  remainingOffers: number;
}) {
  const active = wallets.filter((wallet) => wallet.status === "active");
  const hero = active[0] ?? wallets[0];
  const savings = active.reduce(
    (total, wallet) => total + voucherFaceValue(wallet),
    0,
  );
  // Beyond the hero: one spare active voucher gets a mini tile, two or
  // more fan out as the stacked deck. Anything still hidden joins the
  // "+N" overflow tile into the archive below.
  const extras = active.slice(1);
  const deckWallets = extras.length >= 2 ? extras.slice(0, 4) : [];
  const minis = deckWallets.length > 0 ? [] : extras.slice(0, 2);
  const deckOverflow = Math.max(0, extras.length - deckWallets.length);
  const overflow = wallets.length - 1 - minis.length - deckWallets.length;

  return (
    <section
      aria-label="Ví voucher của bạn"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4"
    >
      {hero ? <WalletHeroTicket wallet={hero} /> : null}
      {deckWallets.length > 0 ? (
        <WalletDeck wallets={deckWallets} overflow={deckOverflow} />
      ) : null}
      <WalletStatTile
        icon={FiTag}
        value={active.length}
        format={countFormat}
        label="voucher sẵn sàng dùng"
      />
      {savings > 0 ? (
        <WalletStatTile
          icon={FiPercent}
          value={savings}
          format={formatPromoVnd}
          label="tiết kiệm tối đa"
        />
      ) : null}
      {remainingOffers > 0 ? (
        <a
          href="#vouchers-con-lai"
          data-reveal
          aria-label={`Xem ${remainingOffers} ưu đãi bạn chưa có`}
          className="flex min-h-[44px] flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <p className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            <FiArrowDown aria-hidden="true" className="h-5 w-5" />
          </p>
          <div>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {remainingOffers}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              ưu đãi bạn chưa có
            </p>
          </div>
        </a>
      ) : null}
      {minis.map((wallet) => (
        <WalletMiniTile key={wallet.id} wallet={wallet} />
      ))}
      {overflow > 0 ? (
        <a
          href="#tat-ca-voucher"
          data-reveal
          aria-label={`Xem tất cả ${wallets.length} voucher của bạn`}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm font-semibold text-zinc-600 transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          +{overflow} voucher nữa
          <FiArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      ) : null}
    </section>
  );
}
