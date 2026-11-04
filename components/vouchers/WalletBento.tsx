import { FiArrowRight } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import { formatPromoVnd } from "../promotions/promo-format";
import { WalletHeroTicket } from "./WalletHeroTicket";
import { WalletMiniTile } from "./WalletMiniTile";
import { WalletStatTile } from "./WalletStatTile";

const countFormat = (value: number): string =>
  new Intl.NumberFormat("vi-VN").format(value);

const TEXT_LINK =
  "flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100";

// Lists the most vouchers in the owner's wallet above the archive.
const WALLET_LIST_LIMIT = 4;

function voucherFaceValue(wallet: VoucherWallet): number {
  if (wallet.discountType === "fixed") return wallet.remainingValue;
  if (wallet.discountType === "percent") return wallet.maxDiscount;
  return 0;
}

// The owner's wallet as a chapter: the best usable voucher leads as text,
// the counts sit beside it as ruled rows, and the other active vouchers are a
// ruled list. Used or expired vouchers stay in the paged archive below.
export function WalletBento({
  wallets,
  remainingOffers,
}: {
  wallets: VoucherWallet[];
  remainingOffers: number;
}) {
  const active = wallets.filter((wallet) => wallet.spendable);
  const hero = active[0] ?? wallets[0];
  const savings = active.reduce(
    (total, wallet) => total + voucherFaceValue(wallet),
    0,
  );
  const extras = active.slice(1);
  const minis = extras.slice(0, WALLET_LIST_LIMIT);
  const overflow = wallets.length - 1 - minis.length;

  return (
    <section aria-label="Ví voucher của bạn" className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12">
        {hero ? <WalletHeroTicket wallet={hero} /> : null}
        <div className="flex flex-col divide-y divide-zinc-200 self-start dark:divide-zinc-800">
          <WalletStatTile
            value={active.length}
            format={countFormat}
            label="voucher sẵn sàng dùng"
          />
          {savings > 0 ? (
            <WalletStatTile
              value={savings}
              format={formatPromoVnd}
              label="đã tiết kiệm"
            />
          ) : null}
          {remainingOffers > 0 ? (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {remainingOffers} ưu đãi bạn chưa có
              </p>
              <a href="#vouchers-con-lai" className={TEXT_LINK}>
                Xem ưu đãi
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          ) : null}
        </div>
      </div>
      {minis.length > 0 || overflow > 0 ? (
        <div className="flex flex-col border-t border-zinc-200 dark:border-zinc-800">
          {minis.length > 0 ? (
            <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {minis.map((wallet) => (
                <li key={wallet.id}>
                  <WalletMiniTile wallet={wallet} />
                </li>
              ))}
            </ul>
          ) : null}
          {overflow > 0 ? (
            <a
              href="#tat-ca-voucher"
              className={`${TEXT_LINK} mt-2 self-start`}
            >
              +{overflow} voucher nữa
              <FiArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
