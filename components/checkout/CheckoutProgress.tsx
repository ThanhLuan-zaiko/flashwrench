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
                    ? "border-[#111111] bg-[#FB923C] text-[#111111] dark:border-[#FB923C] dark:bg-[#FB923C] dark:text-[#111111]"
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={`text-sm ${
                  active
                    ? "font-bold text-[#111111] dark:text-zinc-50"
                    : done
                      ? "font-semibold text-zinc-900 dark:text-zinc-100"
                      : "font-semibold text-zinc-600 dark:text-zinc-400"
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
                    ? "bg-[#111111] dark:bg-zinc-100"
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
