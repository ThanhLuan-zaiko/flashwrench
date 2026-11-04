import Link from "next/link";
import { EmptyCartNotice } from "@/components/cart/EmptyCartNotice";

type CheckoutNoticesProps = {
  isStaff: boolean;
  cartEmpty: boolean;
};

// Non-purchasable states: staff roles and empty carts see guidance
// instead of the checkout form.
export function CheckoutNotices({ isStaff, cartEmpty }: CheckoutNoticesProps) {
  if (isStaff) {
    return (
      <div data-reveal className="py-8 text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Chỉ tài khoản khách hàng mới đặt được hàng
        </p>
        <Link
          href="/products"
          className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }
  if (!cartEmpty) return null;
  return <EmptyCartNotice />;
}
