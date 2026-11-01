import Link from "next/link";
import {
  BRAND_OUTLINE_BUTTON,
  BRAND_SOLID_BUTTON,
} from "@/components/ui/brand";

// Guest state of the /vouchers wallet: the wallet belongs to an account, so a
// guest gets one ruled row saying so, with sign-in and sign-up links, instead
// of an empty wallet and a load error.
export function VoucherGuestPanel() {
  return (
    <section
      aria-label="Đăng nhập để xem ví voucher"
      className="flex flex-col gap-4 border-y border-zinc-200 py-5 md:flex-row md:items-center md:justify-between md:gap-10 dark:border-zinc-800"
    >
      <div>
        <p className="text-base font-bold text-zinc-900 md:text-lg dark:text-zinc-50">
          Đăng nhập để xem ví voucher
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Voucher được lưu theo tài khoản. Khách chưa có tài khoản vẫn xem được
          các ưu đãi đang chạy bên dưới.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/login?next=%2Fvouchers"
          prefetch
          className={BRAND_SOLID_BUTTON}
        >
          Đăng nhập
        </Link>
        <Link
          href="/register?next=%2Fvouchers"
          prefetch
          className={BRAND_OUTLINE_BUTTON}
        >
          Tạo tài khoản
        </Link>
      </div>
    </section>
  );
}
