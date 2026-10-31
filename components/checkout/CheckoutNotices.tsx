import Image from "next/image";
import Link from "next/link";

type CheckoutNoticesProps = {
  isStaff: boolean;
  cartEmpty: boolean;
};

// Non-purchasable states: staff roles and empty carts see guidance
// instead of the checkout form.
export function CheckoutNotices({ isStaff, cartEmpty }: CheckoutNoticesProps) {
  if (isStaff) {
    return (
      <div
        data-reveal
        className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
      >
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Chỉ tài khoản khách hàng mới đặt được hàng
        </p>
        <Link
          href="/products"
          className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }
  if (!cartEmpty) return null;
  return (
    <div
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-6 text-center sm:p-10 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Image
        src="/images/isometric/basket.svg"
        alt=""
        width={60}
        height={56}
        className="mx-auto mb-4 h-28 w-auto sm:h-32"
      />
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Giỏ hàng đang trống
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Thêm ắc quy, dầu nhớt hay bóng đèn vào giỏ để đặt hàng.
      </p>
      <Link
        href="/products"
        className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C]"
      >
        Xem sản phẩm
      </Link>
    </div>
  );
}
