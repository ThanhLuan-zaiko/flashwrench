import { FiCheckCircle, FiCreditCard, FiShoppingCart } from "react-icons/fi";

const STEPS = [
  { label: "Giỏ hàng", Icon: FiShoppingCart },
  { label: "Thanh toán", Icon: FiCreditCard },
  { label: "Hoàn tất", Icon: FiCheckCircle },
] as const;

const CURRENT = 1;

// Desktop-only breadcrumb of the order journey. The cart is done, this
// screen is the current stop and the confirmation comes after submit.
export function CheckoutProgress() {
  return (
    <ol
      aria-label="Các bước đặt hàng"
      className="hidden items-center gap-3 md:flex"
    >
      {STEPS.map(({ label, Icon }, index) => {
        const done = index < CURRENT;
        const active = index === CURRENT;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-3"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  done || active
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={`text-sm ${
                  active
                    ? "font-bold text-[#1E3A5F] dark:text-zinc-50"
                    : done
                      ? "font-semibold text-zinc-900 dark:text-zinc-100"
                      : "font-semibold text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {label}
              </span>
            </span>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-0.5 w-10 rounded-full ${
                  done
                    ? "bg-[#1E3A5F] dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
