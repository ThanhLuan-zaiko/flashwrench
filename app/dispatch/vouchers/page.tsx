import type { Metadata } from "next";
import { AutoRulesSection } from "../components/vouchers/AutoRulesSection";
import { DispatchVoucherBoard } from "../components/vouchers/DispatchVoucherBoard";

export const metadata: Metadata = {
  title: "Phát voucher",
  description: "Điều phối phát voucher trong hạn mức admin cho phép.",
};

export default function DispatchVouchersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Phát voucher
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Voucher gắn thẳng vào tài khoản khách, không chia sẻ được.
        </p>
      </header>
      <DispatchVoucherBoard />
      <AutoRulesSection />
    </div>
  );
}
