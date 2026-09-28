import { FiKey } from "react-icons/fi";

type PaymentCodeCardProps = {
  code: string;
};

// Customer-facing cash confirmation code. The mechanic must echo these six
// digits before marking cash collected — the customer's proof of handover.
export function PaymentCodeCard({ code }: PaymentCodeCardProps) {
  return (
    <section
      aria-label="Mã xác nhận thanh toán"
      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        <FiKey aria-hidden="true" className="h-3.5 w-3.5" />
        Mã xác nhận thanh toán
      </p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-[0.35em] text-zinc-900 dark:text-zinc-50">
        {code}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Đọc mã này cho thợ khi trả tiền mặt. Thợ chỉ ghi nhận đã thu khi nhập
        đúng mã — không cần mã nếu bạn chuyển khoản.
      </p>
    </section>
  );
}
